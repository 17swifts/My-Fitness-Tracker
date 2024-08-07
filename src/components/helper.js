// Adding a workout plan
const addWorkoutPlan = async (userId, workoutPlan) => {
    try {
        await firestore.collection('users').doc(userId).collection('workoutPlans').add(workoutPlan);
    } catch (error) {
        console.error('Error adding workout plan: ', error);
    }
};

// Fetching workout plans
const fetchWorkoutPlans = async (userId) => {
    try {
        const workoutPlansSnapshot = await firestore.collection('users').doc(userId).collection('workoutPlans').get();
        return workoutPlansSnapshot.docs.map(doc => doc.data());
    } catch (error) {
        console.error('Error fetching workout plans: ', error);
        return [];
    }
};

// Adding statistics
const addStatistics = async (userId, exerciseId, statistics) => {
    try {
        await firestore.collection('users').doc(userId).collection('statistics').doc(exerciseId).set(statistics, { merge: true });
    } catch (error) {
        console.error('Error adding statistics: ', error);
    }
};

// Fetching statistics
const fetchStatistics = async (userId, exerciseId) => {
    try {
        const statisticsDoc = await firestore.collection('users').doc(userId).collection('statistics').doc(exerciseId).get();
        return statisticsDoc.data();
    } catch (error) {
        console.error('Error fetching statistics: ', error);
        return null;
    }
};
