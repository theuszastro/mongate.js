#![allow(non_snake_case)]

use std::env::args;
use std::fs::read_to_string;
use std::path::PathBuf;
use std::process;

mod compiler;
mod errors;
mod generation;
mod parsers;
mod tokenizer;
mod utils;

use crate::compiler::{Compiler, CompilerConfig};

fn main() {
    let mut filename = String::new();
    let mut isNode = true;
    let mut es6 = false;

    for arg in args().collect::<Vec<String>>() {
        if arg.ends_with(".nylock") {
            if filename.is_empty() {
                filename = arg.clone();
            }

            continue;
        }

        match arg.as_str() {
            "--react" => isNode = false,
            "--es6" => es6 = true,
            _ => {}
        }
    }

    if filename.is_empty() {
        println!("Usage: ./Compiler <file>");

        process::exit(1);
    }

    let path = PathBuf::from(filename.clone());
    if path.exists() {
        let content = read_to_string(path).unwrap();

        let mut compiler = Compiler::new(CompilerConfig {
            isNode,
            es6,
            content,
            filename: filename.clone(),
        });

        let (code, _, _) = compiler.run();

        println!("{}", code);

        return;
    }

    println!("{} does not exist", filename);
}
