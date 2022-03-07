#![allow(non_snake_case)]

use std::fs;

mod code;
mod compiler;
mod errors;
mod parser;
mod tokenizer;
mod verifier;

use crate::compiler::{Compiler, CompilerConfig};

fn main() {
    let args: Vec<String> = std::env::args().collect();

    if args.get(1).is_none() {
        println!("Usage: {} <file>", args[0]);

        std::process::exit(1);
    }

    let filename = args[1].clone();
    if !filename.ends_with(".nylock") {
        println!("{} is not supported", filename);

        std::process::exit(1);
    }

    let content = fs::read_to_string(filename.clone())
        .expect(format!("Failed to read file {}", filename.clone()).as_str());

    let mut compiler = Compiler::new(CompilerConfig {
        content,
        filename: filename.to_string(),
    });

    compiler.run();
}
