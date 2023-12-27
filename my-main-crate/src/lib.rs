// wasm is considered "extra_unused_type_parameters"
#![allow(
    incomplete_features,
    clippy::extra_unused_type_parameters,
    clippy::arc_with_non_send_sync
)]

extern crate my_rust_crate;

mod utils;

use log::Level;
use my_rust_crate::{rust_name, MyClass};
use wasm_bindgen::prelude::*;

// lifted from the `console_log` example
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen(start)]
fn run() {
    wasm_logger::init(wasm_logger::Config::new(Level::Debug).message_on_new_line());
    utils::set_panic_hook();

    /*
    log(&format!("Hello from {}!", rust_name())); // should output "Hello from Rust!"

    let x = MyClass::new();
    assert_eq!(x.number(), 42);
    x.set_number(10);
    log(&x.render());
    */
}

#[cfg(test)]
mod tests {
    use crate::{utils::test::*, MyClass};

    use my_rust_crate::isOdd;
    use wasm_bindgen_test::{wasm_bindgen_test as test, wasm_bindgen_test_configure};

    wasm_bindgen_test_configure!(run_in_browser);

    #[test]
    async fn test_func() {
        log!("creating new class");
        assert_eq!(42, 42);

        let x = MyClass::new();
        assert_eq!(x.number(), 42);
        x.set_number(10);
        log!("{}", &x.render());
    }

    #[test]
    async fn test_is_odd() {
        log!("testing is odd");
        assert!(!isOdd(20));
        assert!(isOdd(21));
    }
}
