use std::fs;
use std::path::PathBuf;

use crate::parsers::Parser;
use crate::tokenizer::Tokenizer;
use crate::utils::ParsedToken;

pub struct Compiler {
    config: CompilerConfig,
}

#[derive(Clone)]
pub struct CompilerConfig {
    pub filename: String,
    pub content: String,
}

impl CompilerConfig {
    pub fn new(path: PathBuf, filename: String) -> Self {
        let content = fs::read_to_string(path.clone())
            .expect(format!("Failed to read file {}", path.display()).as_str());

        Self { filename, content }
    }
}

impl Compiler {
    pub fn new(config: CompilerConfig) -> Self {
        Self { config }
    }

    pub fn run(&mut self) -> (String, Vec<ParsedToken>) {
        let CompilerConfig { filename, content } = self.config.clone();

        let tokenizer = Tokenizer::new(filename.clone(), content.clone());
        let mut parser = Parser::new(tokenizer);

        return parser.run();
    }
}
