use std::mem::ManuallyDrop;

use crate::tokenizer::Token;
use crate::utils::pointer::Pointer;

use super::{expression, Expression};

pub fn number(pointer: &mut ManuallyDrop<Pointer>, mut num: String) -> Option<Expression> {
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

    let next = pointer.previewNext(false, false);

    if let Some(data) = next {
        if data.tokenValue() == "/" {
            return Some(Expression::Number(num));
        }
    }

    let op = pointer.take("Operator", true, true);
    if let Some(operator) = op {
        let right = expression(pointer);

        if let Some(right) = right {
            return Some(Expression::Binary(
                Box::new(Expression::Number(num)),
                operator,
                Box::new(right),
            ));
        }

        pointer.error("Expected a right value".to_string());
    }

    Some(Expression::Number(num))
}
