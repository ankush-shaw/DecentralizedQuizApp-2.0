#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_add_and_get_question() {
    let env = Env::default();
    let contract_id = env.register(QuizContract, ());
    let client = QuizContractClient::new(&env, &contract_id);

    let q = String::from_str(&env, "What is the capital of France?");
    let a = String::from_str(&env, "Paris");
    client.create_quiz(&1, &q, &a);

    assert_eq!(client.get_question(&1), q);
    assert_eq!(client.get_total_quizzes(), 1);
}

#[test]
fn test_submit_correct_answer() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(QuizContract, ());
    let client = QuizContractClient::new(&env, &contract_id);
    let user = Address::generate(&env);

    client.create_quiz(&1, &String::from_str(&env, "2+2?"), &String::from_str(&env, "4"));

    let result = client.submit_answer(&user, &1, &String::from_str(&env, "4"));
    assert!(result);
    assert_eq!(client.get_score(&user), 1);
}

#[test]
fn test_submit_incorrect_answer() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(QuizContract, ());
    let client = QuizContractClient::new(&env, &contract_id);
    let user = Address::generate(&env);

    client.create_quiz(&1, &String::from_str(&env, "2+2?"), &String::from_str(&env, "4"));

    let result = client.submit_answer(&user, &1, &String::from_str(&env, "5"));
    assert!(!result);
    assert_eq!(client.get_score(&user), 0);
}
