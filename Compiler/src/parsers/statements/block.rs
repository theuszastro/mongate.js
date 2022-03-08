use std::mem::ManuallyDrop;

use crate::parsers::{expression, statements, ParsedToken};
use crate::tokenizer::Token;
use crate::utils::pointer::Pointer;

pub fn readBlock(pointer: &mut ManuallyDrop<Pointer>, body: &mut Vec<ParsedToken>) {
    loop {
        match pointer.token.clone() {
            Some(Token::Brackets(brack, _)) if brack == "}" => {
                pointer.take("Brackets", true, true);

                break;
            }
            Some(Token::Keyword(key, _)) => {
                if let Some(stmt) = statements(pointer, body, key) {
                    body.push(ParsedToken::Statement(stmt));

                    continue;
                }

                break;
            }
            token => {
                if token.is_none() {
                    pointer.error("Expected a 'end' keyword".to_string());
                }

                if let Some(expr) = expression(pointer) {
                    body.push(ParsedToken::Expr(expr));

                    continue;
                }
            }
        }
    }
}
