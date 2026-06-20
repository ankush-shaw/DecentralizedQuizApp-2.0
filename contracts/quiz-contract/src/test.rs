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

#[test]
fn test_leaderboard_sorting() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(QuizContract, ());
    let client = QuizContractClient::new(&env, &contract_id);

    // Seed 5 questions
    let batch = vec![
        &env,
        (1u32, String::from_str(&env, "Q1"), String::from_str(&env, "A")),
        (2u32, String::from_str(&env, "Q2"), String::from_str(&env, "A")),
        (3u32, String::from_str(&env, "Q3"), String::from_str(&env, "A")),
        (4u32, String::from_str(&env, "Q4"), String::from_str(&env, "A")),
        (5u32, String::from_str(&env, "Q5"), String::from_str(&env, "A")),
    ];
    client.create_quiz_batch(&batch);

    // Generate 6 players (leaderboard limit is 5)
    let p1 = Address::generate(&env);
    let p2 = Address::generate(&env);
    let p3 = Address::generate(&env);
    let p4 = Address::generate(&env);
    let p5 = Address::generate(&env);
    let p6 = Address::generate(&env);

    // Submit answers with different scores
    // P1 gets 3/5
    client.submit_batch(&p1, &vec![&env, (1, String::from_str(&env, "A")), (2, String::from_str(&env, "A")), (3, String::from_str(&env, "A"))]);
    // P2 gets 5/5
    client.submit_batch(&p2, &vec![&env, (1, String::from_str(&env, "A")), (2, String::from_str(&env, "A")), (3, String::from_str(&env, "A")), (4, String::from_str(&env, "A")), (5, String::from_str(&env, "A"))]);
    // P3 gets 1/5
    client.submit_batch(&p3, &vec![&env, (1, String::from_str(&env, "A"))]);
    // P4 gets 4/5
    client.submit_batch(&p4, &vec![&env, (1, String::from_str(&env, "A")), (2, String::from_str(&env, "A")), (3, String::from_str(&env, "A")), (4, String::from_str(&env, "A"))]);
    // P5 gets 2/5
    client.submit_batch(&p5, &vec![&env, (1, String::from_str(&env, "A")), (2, String::from_str(&env, "A"))]);
    // P6 gets 4/5
    client.submit_batch(&p6, &vec![&env, (1, String::from_str(&env, "A")), (2, String::from_str(&env, "A")), (3, String::from_str(&env, "A")), (4, String::from_str(&env, "A"))]);

    // Check leaderboard: top 5 should be sorted descending.
    // Scores: P2 (5), P4 (4), P6 (4), P1 (3), P5 (2). P3 (1) should be pushed out.
    let leaderboard = client.get_leaderboard();
    assert_eq!(leaderboard.len(), 5);

    let (_, s0) = leaderboard.get(0).unwrap();
    let (_, s1) = leaderboard.get(1).unwrap();
    let (_, s2) = leaderboard.get(2).unwrap();
    let (_, s3) = leaderboard.get(3).unwrap();
    let (_, s4) = leaderboard.get(4).unwrap();

    assert_eq!(s0, 5);
    assert_eq!(s1, 4);
    assert_eq!(s2, 4);
    assert_eq!(s3, 3);
    assert_eq!(s4, 2);

    // Verify addresses are correct
    let (a0, _) = leaderboard.get(0).unwrap();
    let (a1, _) = leaderboard.get(1).unwrap();
    assert_eq!(a0, p2);
    // Since p4 and p6 both have 4 points, either order is fine depending on insert sequence.
    assert!(a1 == p4 || a1 == p6);
}
