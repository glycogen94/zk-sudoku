pub fn set_panic_hook() {
    // 웹어셈블리에서 패닉 발생 시 더 명확한 오류 메시지를 제공하기 위한 훅 설정
    console_error_panic_hook::set_once();
}
