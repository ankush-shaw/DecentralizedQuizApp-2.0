import { getQuestion } from './src/services/soroban';

async function check() {
  console.log('Checking Question 1...');
  try {
    const q1 = await getQuestion(1);
    console.log('Question 1 Result:', q1);
  } catch (e) {
    console.error('Question 1 Error:', e);
  }
}

check();
