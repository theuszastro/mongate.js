use std::mem::ManuallyDrop;

use crate::generation::generate;
use crate::tokenizer::{Token, Tokenizer};
use crate::utils::pointer::Pointer;

mod expressions;
mod statements;

use expressions::expression;
pub use expressions::Expression;

#[derive(Debug, Clone)]
pub enum StatementToken {
    VariableDeclaration(Token, Expression),
    ConstantDeclaration(Token, Expression),
}

#[derive(Debug, Clone)]
pub enum ParsedToken {
    Expr(Expression),
    Statement(StatementToken),
}

#[derive(Debug)]
pub struct Parser {
    pointer: Pointer,
    code: String,
}

impl Parser {
    pub fn run(&mut self) {
        let mut pointer = ManuallyDrop::new(self.pointer.clone());

        if pointer.token.is_none() {
            pointer.next(true, true, true);
        }

        loop {
            match pointer.token.clone() {
                None | Some(Token::EOF) => break,
                Some(Token::Keyword(keyword, _)) => {
                    let stmt = statements::statements(&mut pointer, keyword);

                    if let Some(statement) = stmt {
                        generate(ParsedToken::Statement(statement), &mut self.code);
                    }
                }
                _ => {
                    let expr = expression(&mut pointer);
                    if let Some(expression) = expr {
                        generate(ParsedToken::Expr(expression.clone()), &mut self.code);

                        continue;
                    }

                    if let Some(token) = pointer.token.clone() {
                        pointer.error(format!("Unexpected '{}'", token.tokenValue()));
                    }
                }
            }
        }

        println!("{}", self.code);

        drop(pointer);
    }

    pub fn new(tokenizer: Tokenizer) -> Self {
        Self {
            pointer: Pointer::new(tokenizer),
            code: String::new(),
        }
    }
}
