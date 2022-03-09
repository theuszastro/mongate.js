use std::mem::ManuallyDrop;

use super::block::readBlock;

use crate::parsers::expression;
use crate::utils::{
    findName, AvoidingBlock, Expression, ParsedToken, Pointer, StatementToken, Token,
};

fn readArgs(pointer: &mut ManuallyDrop<Pointer>, body: &mut AvoidingBlock) -> Vec<Expression> {
    let mut args: Vec<Expression> = vec![];

    pointer.take("Brackets", true, true);

    if let Some(Token::Brackets(brack, _)) = pointer.token.clone() {
        if brack == ")" {
            pointer.next(true, true);

            return args;
        }
    }

    loop {
        match pointer.token.clone() {
            Some(Token::Brackets(brack, _)) if brack == ")" => {
                pointer.take("Brackets", true, true);

                break;
            }
            Some(Token::Identifier(arg, _)) => {
                pointer.take("Identifier", true, true);

                match pointer.token.clone() {
                    Some(Token::Punctuation(punc, _)) => {
                        pointer.take("Punctuation", true, true);

                        match punc.as_str() {
                            "=" => {
                                if let Some(value) = expression(pointer) {
                                    let expr = Expression::FunctionArg(arg, Some(Box::new(value)));

                                    args.push(expr.clone());
                                    body.current.push(ParsedToken::Expr(expr));

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
                                    body.current.push(ParsedToken::Expr(expr));
                                    continue;
                                }
                                pointer.error("Unexpected ','".to_string());
                            }
                            data => pointer.error(format!("Unexpected: {}", data)),
                        }
                    }

                    _ => {}
                }

                let expr = Expression::FunctionArg(arg.clone(), None);

                args.push(expr.clone());
                body.current.push(ParsedToken::Expr(expr));
            }
            None => pointer.error("Expected ')'".to_string()),
            _ => {}
        }
    }

    args
}

pub fn function(
    pointer: &mut ManuallyDrop<Pointer>,
    body: &mut AvoidingBlock,
    isAsync: bool,
) -> Option<StatementToken> {
    if isAsync {
        let func = pointer.take("Keyword", true, true);
        if func.is_none() {
            pointer.error("Unexpected 'async'".to_string());
        }
    }

    if let Some(Token::Identifier(name, _)) = pointer.take("Identifier", true, true) {
        let exists = findName(&body.current, name.clone());
        if exists.is_some() {
            pointer.error(format!("Identifier '{}' already declared", name));
        }

        let mut funcBody = AvoidingBlock {
            current: vec![],
            block: Box::new(Some(body.clone())),
        };

        let args = readArgs(pointer, &mut funcBody);

        let open = pointer.take("Brackets", true, true);
        if open.is_none() || open.unwrap().tokenValue() != "{" {
            pointer.error("Expected '{'".to_string());
        }

        readBlock(pointer, &mut funcBody);

        return Some(StatementToken::FunctionDeclaration(
            name,
            args,
            funcBody.current,
            isAsync,
        ));
    }

    None
}
