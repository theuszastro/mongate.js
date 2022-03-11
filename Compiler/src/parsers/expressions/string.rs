use std::mem::ManuallyDrop;

use super::logical::logical;
use crate::utils::{Expression, HoistingBlock, Pointer, Token};

pub fn string(
    pointer: &mut ManuallyDrop<Pointer>,
    body: &mut HoistingBlock,
    symbol: String,
) -> Option<Expression> {
    if ["'", "\""].contains(&symbol.as_str()) {
        pointer.take("Symbol", false, false);

        let mut string = String::new();

        loop {
            match pointer.token.clone() {
                Some(Token::Symbol(symbol, _)) if ["'", "\""].contains(&symbol.as_str()) => {
                    if string.ends_with("\\") {
                        string.push_str(symbol.as_str());

                        pointer.take("Symbol", false, false);

                        continue;
                    }

                    break;
                }
                Some(Token::Newline(_)) => break,
                Some(data) => {
                    string.push_str(data.tokenValue().as_str());

                    pointer.next(false, false);
                }
                None => break,
            }
        }

        let close = pointer.take("Symbol", true, true);
        if close.is_none() || close.clone().unwrap().tokenValue() != symbol {
            pointer.error(format!("Expected '{}'", symbol));
        }

        let expr = Expression::String(string);

        if let Some(logical) = logical(pointer, body, expr.clone()) {
            return Some(logical);
        }

        return Some(expr);
    }

    None
}
