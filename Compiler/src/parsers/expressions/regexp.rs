use std::mem::ManuallyDrop;

use super::Expression;

use crate::tokenizer::Token;
use crate::utils::pointer::Pointer;

pub fn regexp(pointer: &mut ManuallyDrop<Pointer>) -> Option<Expression> {
    let next = pointer.previewNext(false, false, false);
    if next.is_none() || next.unwrap().tokenValue() == "/" {
        return None;
    }

    let allowedFlags = ["g", "i", "m", "y", "u"];

    let mut regex = String::new();
    let mut regexFlags = String::new();

    pointer.take("Operator", false, false, false);

    loop {
        match pointer.token.clone() {
            None => break,
            Some(Token::Operator(op, _)) => {
                if op == "/" {
                    break;
                }

                regex.push_str(op.as_str());
            }
            data => {
                regex.push_str(data.unwrap().tokenValue().as_str());
            }
        }

        pointer.next(false, false, false);
    }

    let close = pointer.take("Operator", true, true, false);
    if close.is_none() {
        pointer.error("Expected closing '/'".to_string());
    }

    match pointer.token.clone() {
        Some(Token::Identifier(data, _)) => {
            pointer.take("Identifier", true, true, true);

            let mut flags: Vec<&str> = vec![];

            for flag in data.split("").filter(|x| x.len() >= 1) {
                if !allowedFlags.contains(&flag) {
                    pointer.error(format!("Invalid flag '{}'", flag));
                }

                if flags.contains(&flag) {
                    pointer.error(format!("This flag already exists '{}'", flag));
                }

                flags.push(flag);
            }

            regexFlags.push_str(flags.join("").as_str());
        }
        Some(Token::Whitespace(_)) => {
            pointer.next(true, true, true);

            if let Some(Token::Identifier(data, _)) = pointer.token.clone() {
                pointer.error(format!("Unexpected Idenfier '{}'", data));
            }
        }
        _ => {}
    }

    Some(Expression::RegExp(regex, regexFlags))
}
