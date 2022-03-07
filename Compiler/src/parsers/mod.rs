use std::mem::ManuallyDrop;

use crate::tokenizer::{Token, Tokenizer};
use crate::utils::pointer::Pointer;

mod expression;

use expression::{expression, Expression};

#[derive(Debug, Clone)]
pub enum BodyToken {
    VariableDeclaration(Token, Expression),
    ConstantDeclaration(Token, Expression),
}

#[derive(Debug, Clone)]
pub enum ParsedToken {
    Expr(Expression),
    Body(BodyToken),
}

#[derive(Debug)]
pub struct Parser {
    pointer: Pointer,
}

impl Parser {
    pub fn run(&mut self) {
        let mut pointer = ManuallyDrop::new(self.pointer.clone());

        if pointer.token.is_none() {
            pointer.next(true, true, true);
        }

        let mut body: Vec<ParsedToken> = vec![];

        loop {
            match pointer.token.clone() {
                None | Some(Token::EOF) => break,
                Some(Token::Keyword(keyword, _)) => continue,
                _ => {
                    let expr = expression(&mut pointer);
                    if let Some(expression) = expr {
                        body.push(ParsedToken::Expr(expression));

                        continue;
                    }

                    if let Some(token) = pointer.token.clone() {
                        pointer.error(format!("Unexpected '{}'", token.tokenValue()));
                    }
                }
            }
        }

        for token in body {
            match token {
                ParsedToken::Expr(expr) => {
                    println!("{:?}", expr);
                }
                ParsedToken::Body(bodyToken) => {
                    println!("{:?}", bodyToken);
                }
            }
        }

        drop(pointer);
    }

    pub fn new(tokenizer: Tokenizer) -> Self {
        Self {
            pointer: Pointer::new(tokenizer),
        }
    }
}
