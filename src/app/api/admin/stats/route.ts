import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { getDocs, collection, query, orderBy, Timestamp, getFirestore } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

// GET /api/admin/stats - Get dashboard statistics
export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  try {
    // Get total users count
    const listUsersResult = await adminAuth.listUsers();
    const totalUsers = listUsersResult.users.length;

    // Get requests from Firestore
    const requestsRef = collection(db, 'requests');
    
    // Get all requests and filter in memory to avoid complex queries
    const allRequestsQuery = query(requestsRef, orderBy('submittedAt', 'desc'));
    const allRequestsSnapshot = await getDocs(allRequestsQuery);
    
    // Convert to array and close the snapshot
    const allRequests = allRequestsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      submittedAt: doc.data().submittedAt?.toDate(),
      completedAt: doc.data().completedAt?.toDate(),
    }));
    allRequestsSnapshot.docs.forEach(doc => doc.ref.firestore.terminate());

    // Calculate statistics
    const pendingRequests = allRequests.filter(req => req.status === 'pending').length;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedToday = allRequests.filter(req => 
      req.status === 'completed' && 
      req.completedAt && 
      req.completedAt >= today
    ).length;

    // Get recent requests (first 10)
    const recentRequests = allRequests.slice(0, 10).map(request => ({
      id: request.id,
      clientName: request.clientName || 'Anonymous',
      type: request.type || 'General',
      status: request.status || 'Pending',
      date: request.submittedAt?.toLocaleDateString() || new Date().toLocaleDateString(),
    }));

    // Calculate request trends for the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      return date;
    }).reverse();

    const requestTrends = {
      labels: last7Days.map(date => date.toLocaleDateString('en-US', { weekday: 'short' })),
      data: last7Days.map(date => {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        return allRequests.filter(req => 
          req.submittedAt && 
          req.submittedAt >= date && 
          req.submittedAt < nextDay
        ).length;
      })
    };

    // Terminate Firestore connection
    const firestore = getFirestore();
    await firestore.terminate();

    return NextResponse.json({
      totalUsers,
      pendingRequests,
      completedToday,
      recentRequests,
      requestTrends,
    });
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
} 