#![no_std]

use soroban_sdk::{contract, contractimpl, Address, Env, Map, String, Symbol, symbol_short};

#[contract]
pub struct QuizContract;

// Storage keys
const QUESTIONS_KEY: Symbol = symbol_short!("QUESTIONS");
const SCORES_KEY: Symbol = symbol_short!("SCORES");
const COUNT_KEY: Symbol = symbol_short!("COUNT");

#[contractimpl]
impl QuizContract {
    /// Add a question. Stores (question_text, correct_answer) by id.
    pub fn create_quiz(env: Env, id: u32, question: String, answer: String) {
        let mut questions: Map<u32, (String, String)> = env
            .storage()
            .instance()
            .get(&QUESTIONS_KEY)
            .unwrap_or(Map::new(&env));

        questions.set(id, (question, answer));
        env.storage().instance().set(&QUESTIONS_KEY, &questions);

        // Track the highest question ID (for get_total_quizzes)
        let count: u32 = env
            .storage()
            .instance()
            .get(&COUNT_KEY)
            .unwrap_or(0);
        if id > count {
            env.storage().instance().set(&COUNT_KEY, &id);
        }
    }

    /// Fetch the question text for a given ID. Returns empty string if not found.
    pub fn get_question(env: Env, id: u32) -> String {
        let questions: Map<u32, (String, String)> = env
            .storage()
            .instance()
            .get(&QUESTIONS_KEY)
            .unwrap_or(Map::new(&env));

        match questions.get(id) {
            Some((q, _)) => q,
            None => String::from_str(&env, ""),
        }
    }

    /// Submit an answer. Deducts auth from the solver's account, checks answer, updates score.
    pub fn submit_answer(env: Env, solver: Address, id: u32, answer: String) -> bool {
        solver.require_auth();

        let questions: Map<u32, (String, String)> = env
            .storage()
            .instance()
            .get(&QUESTIONS_KEY)
            .unwrap_or(Map::new(&env));

        let (_, correct_answer) = match questions.get(id) {
            Some(entry) => entry,
            None => return false,
        };

        if answer == correct_answer {
            let mut scores: Map<Address, u32> = env
                .storage()
                .instance()
                .get(&SCORES_KEY)
                .unwrap_or(Map::new(&env));

            let current = scores.get(solver.clone()).unwrap_or(0);
            scores.set(solver, current + 1);
            env.storage().instance().set(&SCORES_KEY, &scores);
            true
        } else {
            false
        }
    }

    /// Get the score for a specific user. Returns 0 if never played.
    pub fn get_score(env: Env, user: Address) -> u32 {
        let scores: Map<Address, u32> = env
            .storage()
            .instance()
            .get(&SCORES_KEY)
            .unwrap_or(Map::new(&env));

        scores.get(user).unwrap_or(0)
    }

    /// Returns the total number of questions added.
    pub fn get_total_quizzes(env: Env) -> u32 {
        env.storage().instance().get(&COUNT_KEY).unwrap_or(0)
    }
}

mod test;
