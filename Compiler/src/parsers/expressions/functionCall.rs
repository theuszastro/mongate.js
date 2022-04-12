use std::mem::ManuallyDrop;

use super::expression;

use crate::utils::{findBody, findGlobalFunc, findImports, formatFunctionName};
use crate::utils::{Expression, HoistingBlock, Pointer, Token};

pub fn functionCall(
    pointer: &mut ManuallyDrop<Pointer>,
    body: &mut HoistingBlock,
) -> Option<Expression> {
    match pointer.token.clone() {
        Some(Token::Identifier(name, _)) => {
            let next = pointer.previewNext(true, true);

            if let Some(next) = next {
                if next.tokenType() != "Brackets" || next.tokenValue() != "(" {
                    return None;
                }
            }

            pointer.take("Identifier", true, true);

            let mut args: Vec<Expression> = vec![];

            match pointer.token.clone() {
                Some(Token::Brackets(bracket, _)) if bracket == "(" => {
                    pointer.take("Brackets", true, true);

                    match pointer.token.clone() {
                        Some(Token::Brackets(bracket, _)) if bracket == ")" => {}
                        _ => loop {
                            if let Some(expr) = expression(pointer, body) {
                                args.push(expr);

                                match pointer.token.clone() {
                                    Some(Token::Brackets(bracket, _)) if bracket == ")" => {
                                        break;
                                    }
                                    Some(Token::Punctuation(punctuation, _))
                                        if punctuation == "," =>
                                    {
                                        pointer.take("Punctuation", true, true);
                                    }
                                    _ => break,
                                }
                            }
                        },
                    }

                    if let Some(Token::Brackets(brack, _)) = pointer.take("Brackets", true, true) {
                        if brack == ")" {
                            if findImports(&pointer.imports, name.clone()) {
                                return Some(Expression::FunctionCall(name, args));
                            }

                            let globalFun = findGlobalFunc(&pointer.globalFunctions, name.clone());
                            if findBody(body.clone(), name.clone()).is_none() && globalFun.is_none()
                            {
                                pointer.error(format!("Function '{}' not declared", name));
                            }

                            return Some(Expression::FunctionCall(
                                formatFunctionName(name, globalFun),
                                args,
                            ));
                        }
                    }

                    pointer.error("Expected ')'".to_string());

                    None
                }
                _ => None,
            }
        }
        _ => None,
    }
}
