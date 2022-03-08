use crate::parsers::ParsedToken;
use std::mem::ManuallyDrop;

use crate::parsers::{expression, statements, Expression, StatementToken};
use crate::tokenizer::Token;
use crate::utils::{findName, pointer::Pointer};

fn readArgs(pointer: &mut ManuallyDrop<Pointer>, body: &mut Vec<ParsedToken>) -> Vec<Expression> {
    let mut args: Vec<Expression> = vec![];

    loop {
        if let Some(Token::Identifier(arg, _)) = pointer.take("Identifier", true, true) {
            if let Some(Token::Punctuation(punc, _)) = pointer.take("Punctuation", true, true) {
                match punc.as_str() {
                    "=" => {
                        if let Some(value) = expression(pointer) {
                            let expr = Expression::FunctionArg(arg.clone(), Some(Box::new(value)));

                            args.push(expr.clone());
                            body.push(ParsedToken::Expr(expr));

                            match pointer.token.clone() {
                                Some(Token::Punctuation(punc, _)) => {
                                    if punc == "," {
                                        pointer.next(true, true);

                                        continue;
                                    }

                                    pointer.error(format!("Unexpected '{}'", punc));
                                }
                                _ => {}
                            }

                            continue;
                        }

                        pointer.error(format!("Unexpected '{}'", punc));
                    }
                    "," => {
                        if let Some(Token::Identifier(_, _)) = pointer.token.clone() {
                            let expr = Expression::FunctionArg(arg.clone(), None);

                            args.push(expr.clone());
                            body.push(ParsedToken::Expr(expr));

                            continue;
                        }

                        pointer.error("Unexpected ','".to_string());
                    }
                    data => pointer.error(format!("Unexpected: {}", data)),
                }
            }

            let expr = Expression::FunctionArg(arg.clone(), None);

            args.push(expr.clone());
            body.push(ParsedToken::Expr(expr));
        }

        break;
    }

    args
}

pub fn function(
    pointer: &mut ManuallyDrop<Pointer>,
    body: &mut Vec<ParsedToken>,
    isAsync: bool,
) -> Option<StatementToken> {
    if isAsync {
        let def = pointer.take("Keyword", true, true);
        if def.is_none() {
            pointer.error("Unexpected 'async'".to_string());
        }
    }

    if let Some(Token::Identifier(name, _)) = pointer.take("Identifier", true, true) {
        let exists = findName(&body, name.clone());
        if exists.is_some() {
            pointer.error(format!("Identifier '{}' already declared", name));
        }

        let mut funcBody: Vec<ParsedToken> = vec![];

        let args = readArgs(pointer, &mut funcBody);

        loop {
            match pointer.token.clone() {
                Some(Token::Keyword(key, _)) => {
                    if key == "end" {
                        pointer.take("Keyword", true, true);

                        break;
                    }

                    if let Some(stmt) = statements(pointer, &mut funcBody, key) {
                        funcBody.push(ParsedToken::Statement(stmt));

                        continue;
                    }

                    break;
                }
                token => {
                    if token.is_none() {
                        pointer.error("Expected a 'end' keyword".to_string());
                    }

                    if let Some(expr) = expression(pointer) {
                        funcBody.push(ParsedToken::Expr(expr));

                        continue;
                    }
                }
            }
        }

        return Some(StatementToken::FunctionDeclaration(
            name, args, funcBody, isAsync,
        ));
    }

    None
}
