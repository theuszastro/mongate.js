// use std::thread;

use crate::parser::Parser;
use crate::tokenizer::Tokenizer;

pub struct Compiler {
    config: CompilerConfig,
}

#[derive(Clone)]
pub struct CompilerConfig {
    pub filename: String,
    pub content: String,
}

impl Compiler {
    pub fn new(config: CompilerConfig) -> Self {
        Self { config }
    }

    pub fn run(&mut self) {
        let CompilerConfig { filename, content } = self.config.clone();

        let tokenizer = Tokenizer::new(filename.clone(), content.clone());
        let mut parser = Parser::new(tokenizer);

        parser.run();
    }
}
