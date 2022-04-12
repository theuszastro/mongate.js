use serde_derive::Serialize;

#[derive(Debug, Clone)]
pub struct HoistingBlock {
    pub block: Box<Option<HoistingBlock>>,
    pub current: Vec<ParsedToken>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct TokenContext {
    pub filename: String,
    pub line: i64,
    pub lineContent: String,
}

#[derive(Serialize, Debug, Clone)]
pub struct ImportedResult {
    pub code: String,
    pub path: String,
}

#[derive(Serialize, Debug, Clone)]
pub struct CompilerResult {
    pub code: String,
    pub imports: Vec<ImportedResult>,
}

#[derive(Debug, Clone, PartialEq)]
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

#[derive(Debug, Clone, PartialEq)]
pub enum Expression {
    Number(String),
    Identifier(String),
    String(String),
    Boolean(String),
    RegExp(String, String),
    Array(Vec<Expression>),
    Object(Vec<(String, Expression)>),
    ParenBinary(Box<Expression>),
    Logical(Box<Expression>, String, Box<Expression>),
    Binary(Box<Expression>, String, Box<Expression>),
    FunctionArg(String, Option<Box<Expression>>),
    FunctionCall(String, Vec<Expression>),
    Null,
    Undefined,
}

#[derive(Debug, Clone, PartialEq)]
pub enum StatementToken {
    IfDeclaration(Expression, Vec<ParsedToken>, Vec<ParsedToken>),
    CommentDeclaration(String),
    ReturnDeclaration(Expression),
    VariableDeclaration(String, Expression),
    ConstantDeclaration(String, Expression),
    ExportDeclaration(Option<String>, Box<ParsedToken>),
    ImportDeclaration(Option<String>, Vec<Token>, String),
    FunctionDeclaration(String, Vec<Expression>, Vec<ParsedToken>, bool),
}

#[derive(Debug, Clone, PartialEq)]
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

#[derive(Debug, Clone)]
pub struct ExportedModule {
    pub isDefault: bool,
    pub token: ParsedToken,
}

#[derive(Debug, Clone)]
pub struct ImportedModule {
    pub path: String,
    pub code: String,
    pub imports: Box<Vec<ImportedModule>>,
    pub names: Vec<Token>,
    pub default: Option<String>,
    pub isLibrary: bool,
}

pub struct Memorized {
    pub tokenizer: (String, usize, usize),
    pub token: Option<Token>,
}

#[derive(Debug, Clone)]
pub struct GlobalFunc {
    pub name: String,
    pub replace: String,
}

impl GlobalFunc {
    pub fn new(name: String, replace: String) -> Self {
        Self { name, replace }
    }
}
