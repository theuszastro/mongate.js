use std::mem::ManuallyDrop;

use crate::parsers::expression;
use crate::utils::{Expression, HoistingBlock, Pointer, StatementToken, Token};

mod block;
mod comment;
mod function;
mod variable;

pub use block::readBlock;

pub fn statements(
    pointer: &mut ManuallyDrop<Pointer>,
    body: &mut HoistingBlock,
) -> Option<StatementToken> {
    match pointer.token.clone() {
        Some(Token::Keyword(keyword, _)) => {
            pointer.take("Keyword", true, true);

            match keyword.as_str() {
                "let" | "const" => variable::variable(pointer, body, keyword == "const"),
                "fn" | "async" => function::function(pointer, body, keyword == "async"),
                "return" => {
                    pointer.take("Keyword", true, true);

                    let expr = expression(pointer, body);
                    if let Some(expr) = expr {
                        return Some(StatementToken::ReturnDeclaration(expr));
                    }

                    Some(StatementToken::ReturnDeclaration(Expression::Undefined))
                }
                _ => None,
            }
        }
        Some(Token::Symbol(symbol, _)) if symbol == "#" => {
            pointer.take("Symbol", false, false);

            comment::comment(pointer)
        }
        Some(Token::Operator(op, _)) if op == "/" => {
            let next = pointer.previewNext(false, false);

            match next {
                Some(Token::Operator(op1, _)) if op1 == "/" => {
                    pointer.take("Operator", false, false);
                    pointer.take("Operator", false, false);

                    return comment::comment(pointer);
                }
                _ => None,
            }
        }
        Some(Token::Punctuation(punc, _)) if punc == ";" => {
            pointer.take("Punctuation", true, true);

            return statements(pointer, body);
        }
        _ => None,
    }
}
