#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, token, Address, Env, String, vec};

#[test]
fn test_batch_seeding_and_getting_questions() {
    let env = Env::default();
    let contract_id = env.register(QuizContract, ());
    let client = QuizContractClient::new(&env, &contract_id);

    let q1 = String::from_str(&env, "What is the capital of France?");
    let a1 = String::from_str(&env, "Paris");
    let q2 = String::from_str(&env, "What is 2+2?");
    let a2 = String::from_str(&env, "4");

    // Test create_quiz_batch
    let batch = vec![
        &env,
        (1u32, q1.clone(), a1.clone()),
        (2u32, q2.clone(), a2.clone()),
    ];
    client.create_quiz_batch(&batch);

    // Verify questions and count
    assert_eq!(client.get_question(&1), q1);
    assert_eq!(client.get_question(&2), q2);
    assert_eq!(client.get_total_quizzes(), 2);
}

#[test]
fn test_submit_batch_answers() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(QuizContract, ());
    let client = QuizContractClient::new(&env, &contract_id);
    let user = Address::generate(&env);

    // Seed questions
    let batch = vec![
        &env,
        (1u32, String::from_str(&env, "What is 2+2?"), String::from_str(&env, "4")),
        (2u32, String::from_str(&env, "What is the capital of France?"), String::from_str(&env, "Paris")),
    ];
    client.create_quiz_batch(&batch);

    // Submit batch answers (1 correct, 1 incorrect)
    let answers = vec![
        &env,
        (1u32, String::from_str(&env, "4")),
        (2u32, String::from_str(&env, "London")), // Incorrect
    ];

    let score = client.submit_batch(&user, &answers);
    assert_eq!(score, 1); // 1 out of 2 correct
}

#[test]
fn test_pay_entry_fee() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(QuizContract, ());
    let client = QuizContractClient::new(&env, &contract_id);

    let player = Address::generate(&env);
    let token_admin = Address::generate(&env);

    // Register a mock token contract (simulating native XLM)
    let token_address = env.register_stellar_asset_contract_v2(token_admin.clone()).address();
    let token_client = token::Client::new(&env, &token_address);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

    // Mint some tokens to the player
    token_admin_client.mint(&player, &1000);

    // Assert initial balances
    assert_eq!(token_client.balance(&player), 1000);
    assert_eq!(token_client.balance(&contract_id), 0);

    // Call the pay_entry_fee method
    client.pay_entry_fee(&player, &token_address, &100);

    // Verify balances changed
    assert_eq!(token_client.balance(&player), 900);
    assert_eq!(token_client.balance(&contract_id), 100);

}


