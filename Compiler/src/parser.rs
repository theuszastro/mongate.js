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
    ParenBinary(Box<Expression>),
    Binary(Box<Expression>, Token, Box<Expression>),
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

    token: Option<Token>,
}

impl Parser {
    fn next(
        &mut self,
        skipNewline: bool,
        skipSemicolon: bool,
        skipWhitespace: bool,
    ) -> Option<Token> {
        match self.tokenizer.getToken() {
            Some(Token::EOF) => None,
            None => None,
            Some(Token::Newline(_)) if skipNewline => {
                return self.next(skipNewline, skipSemicolon, skipWhitespace)
            }
            Some(Token::Whitespace(_)) if skipWhitespace => {
                return self.next(skipNewline, skipSemicolon, skipWhitespace)
            }
            Some(Token::Punctuation(data, _)) if data == ";" && skipNewline => {
                return self.next(skipNewline, skipSemicolon, skipWhitespace)
            }
            Some(Token::Identifier(data, _)) if data.len() <= 0 => None,
            data => {
                self.token = data.clone();

                return data;
            }
        }
    }

    fn previewNext(&mut self) -> Option<Token> {
        let token = self.tokenizer.previewNextToken();

        return token;
    }

    fn take(
        &mut self,
        r#type: &str,
        skipNewline: bool,
        skipSemicolon: bool,
        skipWhitespace: bool,
    ) -> Option<Token> {
        if let Some(token) = self.token.clone() {
            if token.tokenType() == r#type.to_string() {
                self.token = self.next(skipNewline, skipSemicolon, skipWhitespace);

                return Some(token);
            }
        }

        None
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
        let expr = match self.token.clone() {
            Some(Token::Undefined(_)) => Some(Expression::Undefined),
            Some(Token::Null(_)) => Some(Expression::Null),
            Some(Token::Identifier(data, _)) => {
                if ["true", "false"].contains(&data.as_str()) {
                    return Some(Expression::Boolean(data));
                }

                Some(Expression::Identifier(data))
            }
            Some(Token::Brackets(bra, _)) if bra == "(" => {
                self.take("Brackets", true, true, true);

                let expr = self.expression();
                if let Some(expr) = expr {
                    let close = self.take("Brackets", true, true, true);
                    if close.is_none() {
                        self.error("Expected ')'".to_string());
                    }

                    return Some(Expression::ParenBinary(Box::new(expr)));
                }

                None
            }
            Some(Token::Number(data, _)) => {
                let mut number = data.clone();
                let allowedTypes = ["Number", "Identifier"];

                let next = self.previewNext();

                self.take("Number", true, true, true);

                if next.is_some() && allowedTypes.contains(&next.unwrap().tokenType().as_str()) {
                    if let Some(token) = self.token.clone() {
                        if allowedTypes.contains(&token.tokenType().as_str()) {
                            loop {
                                match self.token.clone() {
                                    Some(Token::Identifier(data, _)) => {
                                        if data != "e" {
                                            self.error(format!("Unexpected '{}'", data));
                                        }
                                        number.push_str(&data)
                                    }
                                    Some(Token::Number(data, _)) => number.push_str(&data),
                                    _ => break,
                                };
                                let next = self.previewNext();
                                self.take(
                                    self.token.clone().unwrap().tokenType().as_str(),
                                    true,
                                    true,
                                    true,
                                );
                                if next.is_none()
                                    || !allowedTypes.contains(&next.unwrap().tokenType().as_str())
                                {
                                    break;
                                }
                            }
                        }
                    }
                }

                if number.ends_with("e") {
                    self.error(format!("Unexpected 'e'"));
                }

                if number.ends_with(".") {
                    number.pop();
                }

                let preview = self.previewNext();
                if preview.is_some() && preview.unwrap().tokenValue() == "/" {
                    if self.token.clone().unwrap().tokenValue() == "/" {
                        return Some(Expression::Number(number));
                    }
                }

                let op = self.take("Operator", true, true, true);
                if op.is_some() {
                    let right = self.expression();
                    if right.is_none() {
                        self.error("Expected a right value".to_string());
                    }

                    return Some(Expression::Binary(
                        Box::new(Expression::Number(number)),
                        op.unwrap(),
                        Box::new(right.unwrap()),
                    ));
                }

                Some(Expression::Number(number))
            }
            _ => None,
        };

        expr
    }

    pub fn run(&mut self) {
        let mut parsedToken: Option<ParsedToken> = None;

        if self.token.is_none() {
            self.token = self.next(true, true, true);
        }

        loop {
            if let Some(parsed) = parsedToken.clone() {
                self.verifier.verify(parsed);

                parsedToken = None;
            }

            match self.token.clone() {
                None => break,
                Some(Token::Keyword(data, _)) => match data.as_str() {
                    "let" | "const" => {
                        self.take("Keyword", true, true, true);

                        let name = self.take("Identifier", true, true, true);
                        if name.is_none() {
                            self.error("Expected a Identifier".to_string());
                        }

                        let assign = self.take("Punctuation", true, true, true);
                        if assign.is_none() || assign.clone().unwrap().tokenValue() != "=" {
                            if data == "const" {
                                println!("{:?}", assign);

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
                _ => {
                    let expression = self.expression();

                    if let Some(expr) = expression {
                        match expr.clone() {
                            Expression::Number(_) => {}
                            _ => {
                                parsedToken = Some(ParsedToken::Expr(expr));
                            }
                        }
                    } else {
                        self.error(format!(
                            "Unexpected '{}'",
                            self.token.clone().unwrap().tokenValue()
                        ));
                    }
                }
            }
        }

        self.verifier.end();
    }

    pub fn new(tokenizer: Tokenizer) -> Self {
        Self {
            verifier: Verifier::new(tokenizer.filename.clone()),
            token: None,
            tokenizer,
        }
    }
}
