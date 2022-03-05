use crate::errors::syntax_error::SyntaxError;
use crate::errors::syntax_error::SyntaxErrorConfig;
use crate::tokenizer::Token;
use crate::tokenizer::Tokenizer;
use crate::verifier::Verifier;

#[derive(Debug, Clone)]
pub enum Expression {
    Number(String),
    Identifier(String),
    String(String),
    Boolean(String),
    RegExp(String),
    Array(String),
    Object(String),
    Null,
    Undefined,
}

#[derive(Debug, Clone)]
pub enum BodyToken {
    VariableDeclaration(Token, Expression),
    ConstantDeclaration(Token, Expression),
}

#[derive(Debug, Clone)]
pub enum ParsedToken {
    Expr(Expression),
    Body(BodyToken),
}

#[derive(Debug, Clone)]
pub struct Parser {
    tokenizer: Tokenizer,
    verifier: Verifier,
}

impl Parser {
    fn next(
        &mut self,
        skipNewline: bool,
        skipSemicolon: bool,
        skipWhitespace: bool,
    ) -> Option<Token> {
        let token = self.tokenizer.getToken();

        match token {
            Some(Token::EOF) => None,
            None => None,
            Some(Token::Newline(_)) if skipNewline => {
                return self.next(skipNewline, skipSemicolon, skipWhitespace)
            }
            Some(Token::Whitespace(_)) if skipWhitespace => {
                return self.next(skipNewline, skipSemicolon, skipWhitespace)
            }
            Some(Token::Brackets(data, _)) if data == ";" && skipNewline => {
                return self.next(skipNewline, skipSemicolon, skipWhitespace)
            }
            Some(Token::Identifier(data, _)) if data.len() <= 0 => None,
            _ => token,
        }
    }

    fn error(&self, reason: String) {
        SyntaxError::new(SyntaxErrorConfig::new(
            self.tokenizer.filename.clone(),
            self.tokenizer.lines.clone(),
            self.tokenizer.json,
            self.tokenizer.line,
            reason,
        ));
    }

    fn expression(&mut self) -> Option<Expression> {
        match self.next(true, true, true) {
            Some(Token::Undefined(_)) => Some(Expression::Undefined),
            Some(Token::Null(_)) => Some(Expression::Null),
            Some(Token::Identifier(data, _)) => {
                if ["true", "false"].contains(&data.as_str()) {
                    return Some(Expression::Boolean(data));
                }

                Some(Expression::Identifier(data))
            }
            Some(Token::Number(data, _)) => {
                let mut number = data.clone();

                loop {
                    match self.next(true, true, true) {
                        Some(Token::Identifier(data, _)) => {
                            if data != "e" {
                                self.error(format!("Unexpected '{}'", data));
                            }

                            number.push_str(&data)
                        }
                        Some(Token::Number(data, _)) => number.push_str(&data),
                        _ => break,
                    }
                }

                if number.ends_with("e") {
                    self.error(format!("Unexpected 'e'"));
                }

                if number.ends_with(".") {
                    number.pop();
                }

                Some(Expression::Number(number))
            }
            _ => None,
        }
    }

    pub fn run(&mut self) {
        let mut parsedToken: Option<ParsedToken> = None;

        loop {
            let token = self.next(true, true, true);

            if let Some(parsed) = parsedToken.clone() {
                self.verifier.verify(parsed);

                parsedToken = None;
            }

            match token {
                None => break,
                Some(Token::Keyword(data, _)) => match data.as_str() {
                    "let" | "const" => {
                        let name = self.next(true, true, true);
                        if name.is_none() || name.clone().unwrap().tokenType() != "Identifier" {
                            self.error("Expected a Identifier".to_string());
                        }

                        let assign = self.next(true, true, true);
                        if assign.is_none() || assign.unwrap().tokenValue() != "=" {
                            if data == "const" {
                                self.error("Expected a '='".to_string());
                            }

                            parsedToken = Some(ParsedToken::Body(BodyToken::VariableDeclaration(
                                name.clone().unwrap(),
                                Expression::Undefined,
                            )));

                            continue;
                        }

                        let value = self.expression();

                        if let Some(expr) = value {
                            if data == "const" {
                                parsedToken = Some(ParsedToken::Body(
                                    BodyToken::ConstantDeclaration(name.unwrap(), expr),
                                ));
                            } else {
                                parsedToken = Some(ParsedToken::Body(
                                    BodyToken::VariableDeclaration(name.unwrap(), expr),
                                ));
                            }

                            continue;
                        }

                        self.error("Expected a value".to_string());
                    }
                    _ => {}
                },
                _ => {}
            }
        }

        self.verifier.end();
    }

    pub fn new(tokenizer: Tokenizer) -> Self {
        Self {
            verifier: Verifier::new(tokenizer.filename.clone()),
            tokenizer,
        }
    }
}
