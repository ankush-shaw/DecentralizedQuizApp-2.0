#![no_std]

use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, Map, String, Symbol};

#[contract]
pub struct QuizContract;

#[contractimpl]
impl QuizContract {
    /// Creates a new quiz. This is completely permissionless - anyone can call it.
    /// The ID is generated atomically via a global counter.
    pub fn create_quiz(env: Env, creator: Address, question: String, correct_answer: String) -> u32 {
        // Enforce that the creator actually signed this transaction
        creator.require_auth();

        // Get current count to determine the new quiz ID
        let mut count: u32 = env.storage().instance().get(&symbol_short!("COUNT")).unwrap_or(0);
        count += 1;
        env.storage().instance().set(&symbol_short!("COUNT"), &count);

        let quiz_id = count;

        // Fetch the quizzes map and insert the new quiz (tuple of creator, question, answer)
        let mut quizzes: Map<u32, (Address, String, String)> =
            env.storage().instance().get(&symbol_short!("QUIZZES")).unwrap_or(Map::new(&env));
        
        quizzes.set(quiz_id, (creator, question, correct_answer));
        env.storage().instance().set(&symbol_short!("QUIZZES"), &quizzes);

        quiz_id
    }

    /// Fetches the question string for a given quiz ID
    pub fn get_question(env: Env, id: u32) -> String {
        let quizzes: Map<u32, (Address, String, String)> =
            env.storage().instance().get(&symbol_short!("QUIZZES")).unwrap();

        let (_, q, _) = quizzes.get(id).unwrap();
        q
    }

    /// Submits an answer for a specific quiz ID
    pub fn submit_answer(env: Env, solver: Address, id: u32, answer: String) -> bool {
        // Enforce that the solver mathematically signed this answer transaction
        solver.require_auth();

        let quizzes: Map<u32, (Address, String, String)> =
            env.storage().instance().get(&symbol_short!("QUIZZES")).unwrap();

        let (_, _, correct_answer) = quizzes.get(id).unwrap();

        // Check if the provided answer matches the correct one
        if answer == correct_answer {
            let mut scores: Map<Address, u32> =
                env.storage().instance().get(&symbol_short!("SCORES")).unwrap_or(Map::new(&env));

            let current_score = scores.get(solver.clone()).unwrap_or(0);
            scores.set(solver, current_score + 1);
            env.storage().instance().set(&symbol_short!("SCORES"), &scores);
            true
        } else {
            false
        }
    }

    /// Retrieves the score for a specific player
    pub fn get_score(env: Env, user: Address) -> u32 {
        let scores: Map<Address, u32> =
            env.storage().instance().get(&symbol_short!("SCORES")).unwrap_or(Map::new(&env));

        scores.get(user).unwrap_or(0)
    }

    /// Returns the total number of quizzes created
    pub fn get_total_quizzes(env: Env) -> u32 {
        env.storage().instance().get(&symbol_short!("COUNT")).unwrap_or(0)
    }
}