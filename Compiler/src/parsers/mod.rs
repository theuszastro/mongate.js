use std::mem::ManuallyDrop;

use crate::generation::generate;
use crate::tokenizer::{Token, Tokenizer};
use crate::utils::pointer::Pointer;

mod expressions;
mod statements;

pub use expressions::{expression, Expression};
pub use statements::{statements, StatementToken};

#[derive(Debug, Clone)]
pub enum ParsedToken {
    Expr(Expression),
    Statement(StatementToken),
}

#[derive(Debug)]
pub struct Parser {
    pointer: Pointer,
    code: String,
    body: Vec<ParsedToken>,
}

impl Parser {
    pub fn run(&mut self) {
        let mut pointer = ManuallyDrop::new(self.pointer.clone());

        if pointer.token.is_none() {
            pointer.next(true, true);
        }

        loop {
            match pointer.token.clone() {
                None | Some(Token::EOF) => break,
                Some(Token::Keyword(keyword, _)) => {
                    let stmt = statements::statements(&mut pointer, &mut self.body, keyword);

                    if let Some(statement) = stmt {
                        let parsed = ParsedToken::Statement(statement);
                        generate(parsed.clone(), &mut self.code);

                        self.body.push(parsed);
                    }
                }
                _ => {
                    let expr = expression(&mut pointer);
                    if let Some(expression) = expr {
                        let parsed = ParsedToken::Expr(expression);

                        generate(parsed.clone(), &mut self.code);

                        self.body.push(parsed);

                        continue;
                    }

                    if let Some(token) = pointer.token.clone() {
                        pointer.error(format!("Unexpected '{}'", token.tokenValue()));
                    }
                }
            }
        }

        if self.code.ends_with("\n") {
            self.code.pop();
        }

        println!("{}", self.code);

        drop(pointer);
    }

    pub fn new(tokenizer: Tokenizer) -> Self {
        Self {
            pointer: Pointer::new(tokenizer),
            code: String::new(),
            body: vec![],
        }
    }
}
