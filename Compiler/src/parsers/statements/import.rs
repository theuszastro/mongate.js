use std::mem::ManuallyDrop;

use crate::parsers::expression;

use crate::utils::{findGlobalFunc, findImports, findName, verifyImport};
use crate::utils::{Expression, HoistingBlock, Pointer, StatementToken, Token};

fn readImports(pointer: &mut ManuallyDrop<Pointer>, body: &mut HoistingBlock) -> Vec<Token> {
    let mut imports = vec![];

    loop {
        match pointer.token.clone() {
            Some(Token::Brackets(brack, _)) if brack == "}" => {
                pointer.take("Brackets", true, true);

                break;
            }

            Some(Token::Punctuation(punc, _)) if punc == "," => {
                pointer.take("Punctuation", true, true);

                continue;
            }
            Some(value) => match value.clone() {
                Token::Identifier(name, ..) => {
                    pointer.take("Identifier", true, true);

                    if findName(&body.current, name.clone()).is_some()
                        || findImports(&pointer.imports, name.clone())
                    {
                        pointer.error(format!("Identifier '{}' already declared", name));
                    }

                    if findGlobalFunc(&pointer.globalFunctions, name.clone()).is_some() {
                        pointer.error(format!("Identifier '{}' is a global function ", name));
                    }

                    imports.push(value);
                }
                _ => pointer.error("Expected 'Identifier'".to_string()),
            },
            _ => break,
        }
    }

    imports
}

pub fn import(
    pointer: &mut ManuallyDrop<Pointer>,
    body: &mut HoistingBlock,
) -> Option<StatementToken> {
    pointer.take("Keyword", true, true);

    let mut default: Option<String> = None;

    loop {
        match pointer.token.clone() {
            Some(Token::Identifier(name, _)) => {
                pointer.take("Identifier", true, true);

                if findName(&body.current, name.clone()).is_some()
                    || findImports(&pointer.imports, name.clone())
                {
                    pointer.error(format!("Identifier '{}' already declared", name));
                }

                if findGlobalFunc(&pointer.globalFunctions, name.clone()).is_some() {
                    pointer.error(format!("Identifier '{}' is a global function ", name));
                }

                default = Some(name);

                match pointer.token.clone() {
                    Some(Token::Keyword(key, _)) if key == "from" => {
                        pointer.take("Keyword", true, true);

                        match expression(pointer, body) {
                            Some(Expression::String(from, ..)) => {
                                verifyImport(pointer, default.clone(), vec![], from.clone());

                                return Some(StatementToken::ImportDeclaration(
                                    default,
                                    vec![],
                                    from,
                                ));
                            }
                            _ => pointer.error("Expected a string".to_string()),
                        }
                    }
                    Some(Token::Punctuation(punc, _)) if punc == "," => {
                        pointer.take("Punctuation", true, true);

                        continue;
                    }
                    _ => {}
                }
            }
            Some(Token::Brackets(bra, _)) if bra == "{" => {
                pointer.take("Brackets", true, true);

                let names = readImports(pointer, body);
                if names.is_empty() {
                    pointer.error("Expected 'Identifier'".to_string());
                }

                match pointer.token.clone() {
                    Some(Token::Keyword(key, ..)) if key == "from" => {
                        pointer.take("Keyword", true, true);

                        match expression(pointer, body) {
                            Some(Expression::String(from, ..)) => {
                                verifyImport(pointer, default.clone(), names.clone(), from.clone());

                                return Some(StatementToken::ImportDeclaration(
                                    default, names, from,
                                ));
                            }
                            _ => pointer.error("Expected a string".to_string()),
                        }
                    }
                    _ => {
                        pointer.error("Expected 'from'".to_string());
                    }
                }
            }
            _ => pointer.error("invalid import".to_string()),
        }
    }
}
