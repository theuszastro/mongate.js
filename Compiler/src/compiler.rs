use crate::utils::ImportedModule;
use std::fs;
use std::path::PathBuf;

use crate::parsers::Parser;
use crate::tokenizer::Tokenizer;
use crate::utils::ParsedToken;

pub struct Compiler {
    config: CompilerConfig,
}

#[derive(Clone, Debug)]
pub struct CompilerConfig {
    pub isNode: bool,
    pub es6: bool,
    pub filename: String,
    pub content: String,
}

impl CompilerConfig {
    pub fn new(path: PathBuf, filename: String, isNode: bool, es6: bool) -> Self {
        let content = fs::read_to_string(path.clone())
            .expect(format!("Failed to read file {}", path.display()).as_str());

        Self {
            isNode,
            filename,
            content,
            es6,
        }
    }
}

impl Compiler {
    pub fn new(config: CompilerConfig) -> Self {
        Self { config }
    }

    pub fn run(&mut self) -> (String, Vec<ParsedToken>, Vec<ImportedModule>) {
        let CompilerConfig {
            filename,
            content,
            isNode,
            es6,
        } = self.config.clone();

        let tokenizer = Tokenizer::new(filename.clone(), content.clone());
        let mut parser = Parser::new(tokenizer, isNode, es6);

        return parser.run();
    }
}
