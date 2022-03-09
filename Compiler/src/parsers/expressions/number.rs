use std::mem::ManuallyDrop;

use crate::utils::{Expression, HoistingBlock, Pointer, Token};

use super::expression;

pub fn number(
    pointer: &mut ManuallyDrop<Pointer>,
    body: &mut HoistingBlock,
    mut num: String,
) -> Option<Expression> {
    let allowedTypes = ["Number", "Identifier"];

    let next = pointer.previewNext(false, false);
    pointer.take("Number", true, true);

    if let Some(data) = next {
        if allowedTypes.contains(&data.tokenType().as_str()) {
            loop {
                match pointer.token.clone() {
                    Some(Token::Identifier(iden, _)) => {
                        let allowed = ["e", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

                        'letters: for letter in iden.split("").filter(|x| x.len() >= 1) {
                            if allowed.contains(&letter) {
                                num.push_str(letter);

                                continue 'letters;
                            }

                            pointer.error(format!("Unexpected '{}'", letter));
                        }
                    }
                    Some(Token::Number(number, _)) => num.push_str(&number),
                    _ => break,
                }

                let next = pointer.previewNext(false, false);
                pointer.next(true, true);

                if let Some(result) = next {
                    if allowedTypes.contains(&result.tokenType().as_str()) {
                        continue;
                    }
                }

                break;
            }
        }
    }

    if num.ends_with("e") {
        pointer.error(format!("Unexpected 'e'"));
    }

    if num.ends_with(".") {
        num.pop();
    }

    if let Some(data) = pointer.previewNext(false, false) {
        if let Some(Token::Operator(operator, _)) = pointer.token.clone() {
            if data.tokenValue() == "/" && operator == "/" {
                return Some(Expression::Number(num));
            }
        }
    }

    if let Some(operator) = pointer.take("Operator", true, true) {
        if let Some(right) = expression(pointer, body) {
            return Some(Expression::Binary(
                Box::new(Expression::Number(num)),
                operator,
                Box::new(right),
            ));
        }

        if let Some(value) = pointer.token.clone() {
            pointer.error(format!("Unexpected '{}'", value.tokenValue()));
        } else {
            pointer.error("Expected a right value".to_string());
        }
    }

    Some(Expression::Number(num))
}
