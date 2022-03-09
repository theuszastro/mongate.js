use std::mem::ManuallyDrop;

use crate::generation::generate;
use crate::tokenizer::Tokenizer;
use crate::utils::{AvoidingBlock, ParsedToken, Pointer, Token};

mod expressions;
mod statements;

pub use expressions::expression;
pub use statements::{readBlock, statements};

#[derive(Debug)]
pub struct Parser {
    pointer: Pointer,
    code: String,
    body: AvoidingBlock,
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

                        self.body.current.push(parsed);
                    }
                }
                _ => {
                    let expr = expression(&mut pointer);
                    if let Some(expression) = expr {
                        let parsed = ParsedToken::Expr(expression);

                        generate(parsed.clone(), &mut self.code);

                        self.body.current.push(parsed);

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
            body: AvoidingBlock {
                block: Box::new(None),
                current: vec![],
            },
        }
    }
}
