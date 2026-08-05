package example

import "testing"

func TestGreeting(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  string
	}{
		{name: "named", input: "Ada", want: "Hello, Ada!"},
		{name: "empty falls back", input: "", want: "Hello, world!"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := Greeting(test.input); got != test.want {
				t.Errorf("Greeting(%q) = %q, want %q", test.input, got, test.want)
			}
		})
	}
}
