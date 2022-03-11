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
    pointer: Pointer,
    code: String,
    body: HoistingBlock,
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
                _ => {
                    let mut parsed: Option<ParsedToken> = None;

                    if let Some(Token::Punctuation(punc, _)) = pointer.token.clone() {
                        if punc == ";" {
                            pointer.take("Punctuation", true, true);

                            continue;
                        }
                    }

                    if let Some(statement) = statements(&mut pointer, &mut self.body) {
                        parsed = Some(ParsedToken::Statement(statement));
                    }

                    if let Some(expression) = expression(&mut pointer, &mut self.body) {
                        parsed = Some(ParsedToken::Expr(expression));
                    }

                    if let Some(parsed) = parsed {
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

        println!("{}", self.code);

        drop(pointer);
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
