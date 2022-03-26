use std::mem::ManuallyDrop;

use super::expression;
use crate::utils::{
    findBody, Expression, HoistingBlock, ParsedToken, Pointer, StatementToken, Token,
};

pub fn functionCall(
    pointer: &mut ManuallyDrop<Pointer>,
    body: &mut HoistingBlock,
) -> Option<Expression> {
    match pointer.token.clone() {
        Some(Token::Identifier(name, _)) => {
            let next = pointer.previewNext(false, false);
            let nextSkipping = pointer.previewNext(true, true);

            if let Some(next) = next {
                if let Some(nextSki) = nextSkipping {
                    if next.tokenType() != "Punctuation" || nextSki.tokenType() != "Brackets" {
                        if next.tokenValue() != "!" && nextSki.tokenValue() != "(" {
                            if nextSki.tokenValue() != "!" {
                                return None;
                            }

                            pointer.error(format!(
                                "Unexpected token '{}' after identifier '{}'",
                                next.tokenValue(),
                                name
                            ));
                        }
                    }
                }
            }

            pointer.take("Identifier", true, true);

            let mut args: Vec<Expression> = vec![];

            match pointer.token.clone() {
                Some(Token::Brackets(bracket, _)) if bracket == "(" => {
                    pointer.take("Brackets", true, true);

                    loop {
                        if let Some(expr) = expression(pointer, body) {
                            args.push(expr);

                            match pointer.token.clone() {
                                Some(Token::Brackets(bracket, _)) if bracket == ")" => {
                                    break;
                                }
                                Some(Token::Punctuation(punctuation, _)) if punctuation == "," => {
                                    pointer.take("Punctuation", true, true);
                                }
                                _ => break,
                            }
                        }
                    }

                    if let Some(Token::Brackets(brack, _)) = pointer.take("Brackets", true, true) {
                        if brack == ")" {
                            if findBody(body.clone(), name.clone()).is_none()
                                || !pointer.globalFunctions.contains(&name)
                            {
                                pointer.error(format!("Function '{}' not declared", name));
                            }

                            return Some(Expression::FunctionCall(name, args));
                        }
                    }

                    pointer.error("Expected ')'".to_string());

                    None
                }
                Some(Token::Punctuation(_, _)) => {
                    pointer.take("Punctuation", true, true);

                    loop {
                        if let Some(expr) = expression(pointer, body) {
                            args.push(expr);

                            match pointer.token.clone() {
                                Some(Token::Punctuation(punctuation, _)) if punctuation == "," => {
                                    pointer.take("Punctuation", true, true);
                                }
                                _ => break,
                            }

                            continue;
                        }
                        break;
                    }

                    if findBody(body.clone(), name.clone()).is_none() {
                        pointer.error(format!("Function '{}' not declared", name));
                    }

                    if pointer.globalFunctions.contains(&name) {
                        return Some(Expression::FunctionCall(name, args));
                    }

                    if let Some(data) = findBody(body.clone(), name.clone()) {
                        if let ParsedToken::Statement(StatementToken::FunctionDeclaration(..)) =
                            data
                        {
                            return Some(Expression::FunctionCall(name, args));
                        }

                        pointer.error(format!("Identifier '{}' is not a function", name));
                    }

                    None
                }
                _ => None,
            }
        }
        _ => None,
    }
}
