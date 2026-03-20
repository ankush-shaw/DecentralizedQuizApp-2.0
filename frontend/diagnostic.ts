import { getQuestion, getTotalQuizzes, CONTRACT_ID } from './src/services/soroban';

async function check() {
  console.log('Contract ID:', CONTRACT_ID);
  try {
    const total = await getTotalQuizzes();
    console.log('Total Quizzes:', total);
    
    if (total > 0) {
      const q1 = await getQuestion(1);
      console.log('Question 1:', q1);
    } else {
      console.log('Contract is EMPTY.');
    }
  } catch (e) {
    console.error('Check failed:', e);
  }
}

check();
