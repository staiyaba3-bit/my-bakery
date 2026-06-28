const button = document.getElementById("submitBtn");

button.addEventListener("click", function () {
  const userAnswer = document.getElementById("answer").value;
  const result = document.getElementById("result");

  if (userAnswer == "66") {
    result.innerHTML = "✅ Correct! +10 Points";
    result.style.color = "lightgreen";
  } else {
    result.innerHTML = "❌ Try again!";
    result.style.color = "red";
  }
});