use std::mem::ManuallyDrop;

use crate::generation::generate;
use crate::tokenizer::Tokenizer;
use crate::utils::{HoistingBlock, ParsedToken, Pointer, Token};

mod expressions;
mod statements;

pub use expressions::expression;
pub use statements::{readBlock, statements};

#[derive(Debug)]
pub struct Parser {
    pub pointer: Pointer,
    code: String,
    body: HoistingBlock,
}

impl Parser {
    pub fn run(&mut self) -> (String, Vec<ParsedToken>) {
        let mut pointer = ManuallyDrop::new(self.pointer.clone());

        if pointer.token.is_none() {
            pointer.next(true, true);
        }

        loop {
            match pointer.token.clone() {
                None | Some(Token::EOF) => break,
                _ => {
                    if let Some(Token::Punctuation(punc, _)) = pointer.token.clone() {
                        if punc == ";" {
                            pointer.take("Punctuation", true, true);

                            continue;
                        }
                    }

                    if let Some(statement) = statements(&mut pointer, &mut self.body) {
                        let parsed = ParsedToken::Statement(statement);

                        generate(parsed.clone(), &mut self.code);
                        self.body.current.push(parsed);

                        continue;
                    }

                    if let Some(expression) = expression(&mut pointer, &mut self.body) {
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

        (self.code.clone(), self.body.current.clone())
    }

    pub fn new(tokenizer: Tokenizer) -> Self {
        Self {
            pointer: Pointer::new(tokenizer),
            code: String::new(),
            body: HoistingBlock {
                block: Box::new(None),
                current: vec![],
            },
        }
    }
}
