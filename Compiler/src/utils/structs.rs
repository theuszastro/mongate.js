#[derive(Debug, Clone)]
pub struct HoistingBlock {
    pub block: Box<Option<HoistingBlock>>,
    pub current: Vec<ParsedToken>,
}

#[derive(Debug, Clone)]
pub struct TokenContext {
    pub filename: String,
    pub line: i64,
    pub lineContent: String,
}

#[derive(Debug, Clone)]
pub enum Token {
    Identifier(String, TokenContext),
    Number(String, TokenContext),
    Null(TokenContext),
    Undefined(TokenContext),
    Whitespace(TokenContext),
    Newline(TokenContext),
    LogicalOperator(String, TokenContext),
    Operator(String, TokenContext),
    Keyword(String, TokenContext),
    Punctuation(String, TokenContext),
    Brackets(String, TokenContext),
    Symbol(String, TokenContext),
    EOF,
}

#[derive(Debug, Clone)]
pub enum Expression {
    Number(String),
    Identifier(String),
    String(String),
    Boolean(String),
    RegExp(String, String),
    Array(Vec<Expression>),
    Object(Vec<(String, Expression)>),
    ParenBinary(Box<Expression>),
    Binary(Box<Expression>, Token, Box<Expression>),
    FunctionArg(String, Option<Box<Expression>>),
    Null,
    Undefined,
}

#[derive(Debug, Clone)]
pub enum StatementToken {
    VariableDeclaration(String, Expression),
    ConstantDeclaration(String, Expression),
    FunctionDeclaration(String, Vec<Expression>, Vec<ParsedToken>, bool),
}

#[derive(Debug, Clone)]
pub enum ParsedToken {
    Expr(Expression),
    Statement(StatementToken),
}

impl Token {
    pub fn tokenType(&self) -> String {
        match self {
            Token::Identifier(_, _) => "Identifier".to_string(),
            Token::Number(_, _) => "Number".to_string(),
            Token::Null(_) => "Null".to_string(),
            Token::Undefined(_) => "Undefined".to_string(),
            Token::Whitespace(_) => "Whitespace".to_string(),
            Token::Newline(_) => "Newline".to_string(),
            Token::LogicalOperator(_, _) => "LogicalOperator".to_string(),
            Token::Operator(_, _) => "Operator".to_string(),
            Token::Keyword(_, _) => "Keyword".to_string(),
            Token::Punctuation(_, _) => "Punctuation".to_string(),
            Token::Brackets(_, _) => "Brackets".to_string(),
            Token::Symbol(_, _) => "Symbol".to_string(),
            Token::EOF => "EOF".to_string(),
        }
    }

    pub fn tokenValue(&self) -> String {
        match self {
            Token::Identifier(data, _) => data.to_string(),
            Token::Number(data, _) => data.to_string(),
            Token::Null(_) => "null".to_string(),
            Token::Undefined(_) => "undefined".to_string(),
            Token::Whitespace(_) => " ".to_string(),
            Token::Newline(_) => "\n".to_string(),
            Token::LogicalOperator(data, _) => data.to_string(),
            Token::Operator(data, _) => data.to_string(),
            Token::Keyword(data, _) => data.to_string(),
            Token::Punctuation(data, _) => data.to_string(),
            Token::Brackets(data, _) => data.to_string(),
            Token::Symbol(data, _) => data.to_string(),
            Token::EOF => "EOF".to_string(),
        }
    }
}
