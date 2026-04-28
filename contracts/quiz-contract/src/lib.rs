#![no_std]

use soroban_sdk::{contract, contractimpl, Address, Env, Map, String, Symbol, Vec, symbol_short, token};

const QUESTIONS_KEY: Symbol = symbol_short!("QUZS");
const COUNT_KEY: Symbol = symbol_short!("CNT");

#[contract]
pub struct QuizContract;

#[contractimpl]
impl QuizContract {
    /// Pay an entry fee to start the quiz. This is the INTER-CONTRACT CALL.
    /// It calls the native XLM token contract to transfer 1 XLM.
    pub fn pay_entry_fee(env: Env, player: Address, token_address: Address, amount: i128) {
        player.require_auth();

        // Create a client for the token contract (Inter-contract call!)
        let token_client = token::Client::new(&env, &token_address);
        
        // Transfer XLM from player to this contract
        token_client.transfer(&player, &env.current_contract_address(), &amount);
        
        // Emit event that a player has paid and started
        env.events().publish((symbol_short!("started"), player), amount);
    }

    /// Add multiple questions in one go (Admin).
    pub fn create_quiz_batch(env: Env, items: Vec<(u32, String, String)>) {
        let mut questions: Map<u32, (String, String)> = env.storage().instance().get(&QUESTIONS_KEY).unwrap_or(Map::new(&env));
        let mut count: u32 = env.storage().instance().get(&COUNT_KEY).unwrap_or(0);

        for item in items.iter() {
            let (id, q, a) = item;
            questions.set(id, (q, a));
            if id > count {
                count = id;
            }
        }

        env.storage().instance().set(&QUESTIONS_KEY, &questions);
        env.storage().instance().set(&COUNT_KEY, &count);
    }

    /// Fetch the total number of questions.
    pub fn get_total_quizzes(env: Env) -> u32 {
        env.storage().instance().get(&COUNT_KEY).unwrap_or(0)
    }

    /// Fetch question text.
    pub fn get_question(env: Env, id: u32) -> String {
        let questions: Map<u32, (String, String)> = env.storage().instance().get(&QUESTIONS_KEY).unwrap_or(Map::new(&env));
        if let Some((q, _)) = questions.get(id) {
            q
        } else {
            String::from_str(&env, "")
        }
    }

    /// Submit answers in batch.
    pub fn submit_batch(env: Env, solver: Address, answers: Vec<(u32, String)>) -> u32 {
        solver.require_auth();

        let questions: Map<u32, (String, String)> = env.storage().instance().get(&QUESTIONS_KEY).unwrap_or(Map::new(&env));
        let mut correct = 0;

        for entry in answers.iter() {
            let (id, ans) = entry;
            if let Some((_, correct_ans)) = questions.get(id) {
                if ans == correct_ans {
                    correct += 1;
                    env.events().publish((symbol_short!("quiz_ans"), solver.clone()), id);
                }
            }
        }
        correct
    }
}
