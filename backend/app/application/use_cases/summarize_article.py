from app.application.interfaces.llm import ILLMService


class SummarizeText:
    def __init__(self, llm: ILLMService):
        self.llm = llm

    def execute(self, text: str) -> str:
        return self.llm.summarize(text)
