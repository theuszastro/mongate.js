use std::mem::ManuallyDrop;

use crate::generation::CodeGeneration;
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
    generation: CodeGeneration,
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
                        println!("{:?}", statement);

                        self.generation.generate(ParsedToken::Statement(statement));
                    }
                }
                _ => {
                    let expr = expression(&mut pointer);
                    if let Some(expression) = expr {
                        self.generation
                            .generate(ParsedToken::Expr(expression.clone()));

                        continue;
                    }

                    if let Some(token) = pointer.token.clone() {
                        pointer.error(format!("Unexpected '{}'", token.tokenValue()));
                    }
                }
            }
        }

        println!("{}", self.generation.code);

        drop(pointer);
    }

    pub fn new(tokenizer: Tokenizer) -> Self {
        Self {
            pointer: Pointer::new(tokenizer),
            generation: CodeGeneration::new(),
        }
    }
}
