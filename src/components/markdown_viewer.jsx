import {marked} from "marked";
//import 'github-markdown-css/github-markdown.css';
import 'github-markdown-css/github-markdown-light.css';
import escape from 'escape-html';


// Override function
const renderer = {
  code(param) {
      //Swap the default behavior with custom code block that has copy button
      const id_hash = `"codeblock-${Math.random().toString(36).substr(2, 9)}"`;
      const icon = `<div class="relative size-8 p-1 cursor-pointer rounded-md text-gray-500 hover:bg-blue-100 hover:text-blue-600 -mb-10 ml-auto mr-2" onclick=window.copyToClipboard(${id_hash})>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 8.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v8.25A2.25 2.25 0 0 0 6 16.5h2.25m8.25-8.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-7.5A2.25 2.25 0 0 1 8.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 0 0-2.25 2.25v6" />
        </svg>
      </div>`


      let text = escape(param.text)
      if ( ['html', 'xml', 'xhtml', 'jsx', 'tsx', 'javascript', 'js', 'ts', 'vue', 'svelte'].includes(param.lang) ) {
          text = escape(param.text)
      }

      return (
            `<div>${icon}
<pre>
<code class="language-${param.lang}" id=${id_hash} style="white-space: break-spaces !important;">${text}</code>
</pre>
</div>`
        )
    }
};

marked.use({ renderer });

export const MarkdownViewer = (props) => {
    const { content, showToast } = props
    const onClick = props.onClick || (() => {})
    //className="text-sm leading-relaxed [&_h1]:text-4xl [&_h2]:text-3xl [&_h3]:text-2xl [&_code]:text-base [&_pre]:text-sm"

    window.copyToClipboard = (id) => {
        const codeElement = document.getElementById(id);

        navigator.clipboard.writeText(codeElement.innerText).then(() => {
            console.log('Text copied to clipboard');
        }).catch((err) => {
            console.error('Could not copy text: ', err);
        });

        if (showToast) {
            showToast('Copied to clipboard', 'success')
        }
    }

    return (
        <div
            className="markdown-body pt-6"
            data-color-mode="light"
            dangerouslySetInnerHTML={{ __html: marked(content) }}
            onClick={onClick}
        />
    );
}


export const saveAsMarkdown = (content) => {
    // Create a Blob from the text content
    const blob = new Blob([content], { type: 'text/markdown' });

    // Create a temporary URL for the blob
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = url;
    link.download = 'content.md'; // Default filename

    // Trigger the download
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
