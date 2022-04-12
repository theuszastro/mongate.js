use std::mem::ManuallyDrop;

use crate::generation::generate;
use crate::tokenizer::Tokenizer;
use crate::utils::{HoistingBlock, ImportedModule, ParsedToken, Pointer, Token};

mod expressions;
mod statements;

pub use expressions::expression;
pub use statements::{readBlock, statements};

#[derive(Debug)]
pub struct Parser {
    body: HoistingBlock,
    pointer: Pointer,
}

impl Parser {
    pub fn run(&mut self) -> (String, Vec<ParsedToken>, Vec<ImportedModule>) {
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

                        generate(&mut pointer, parsed.clone());
                        self.body.current.push(parsed);

                        continue;
                    }

                    if let Some(expression) = expression(&mut pointer, &mut self.body) {
                        let parsed = ParsedToken::Expr(expression);

                        generate(&mut pointer, parsed.clone());
                        self.body.current.push(parsed);

                        continue;
                    }

                    if let Some(token) = pointer.token.clone() {
                        pointer.error(format!("Unexpected '{}'", token.tokenValue()));
                    }
                }
            }
        }

        if pointer.isNode {
            return (
                format!(
                    "{}\n{}",
                    pointer
                        .imports
                        .iter()
                        .map(|x| x.code.clone())
                        .collect::<String>(),
                    pointer.code.clone(),
                ),
                self.body.current.clone(),
                vec![],
            );
        }

        return (
            pointer.code.clone(),
            self.body.current.clone(),
            pointer.imports.clone(),
        );
    }

    pub fn new(tokenizer: Tokenizer, folder: String, isNode: bool, es6: bool) -> Self {
        Self {
            pointer: Pointer::new(tokenizer, folder, isNode, es6),
            body: HoistingBlock {
                block: Box::new(None),
                current: vec![],
            },
        }
    }
}
