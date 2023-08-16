import { SimpleIdeaContent } from "./model";
import { Text } from "@chakra-ui/layout";

import MarkdownIt from "markdown-it";
import parse, {DOMNode, Element, HTMLReactParserOptions, domToReact} from 'html-react-parser';

import { ContextualCodeEmbed } from "../common/DocumentationContent";
import { Link } from "@chakra-ui/react";

interface KeywordLinkMap {
    [key: string]: string;
}

interface SimpleContentProps {
    content: SimpleIdeaContent,
}

export const SimpleContent = ({
    content
}: SimpleContentProps) => {
    const keywords: KeywordLinkMap = {  //placeholder
        "display":"reference/display", 
        "infinite loop":"reference/loops",
    };
    
    const addKeywordLinks = (text: string) => {
        const keys = Object.keys(keywords);
        const keywordRegex = new RegExp(`(${keys.join('|')})`, "g");

        const parts = text.split(keywordRegex);
        const replacedParts = parts.map((part, index) => {
            const href = keywords[part];
            if (!href) return <span key={index}>{part}</span>;
            return <Link key={index} color="brand.600" href={href}>{part}</Link>
        });

        return replacedParts;
    }

    const parseOptions: HTMLReactParserOptions = {
        replace: (node: DOMNode) => {
            if (node.type === "text") {
                return <>{addKeywordLinks((node as unknown as Text).data)}</>
            }

            const element = node as Element;
            if (!element) return node;

            if (/^h\d/.test(element.name)) {
                //h1 should not be used as this would represent a section header
                if (element.name === "h1") return (<></>);

                // For the moment we only support displaying as a h3.
                return (
                    <Text fontSize="lg" fontWeight="semibold">
                        {domToReact(element.children)}
                    </Text>
                );
            }
        
            return element;
        }
    }

    const renderContent = (markdown: string) => {
        const md = new MarkdownIt();
        const html =  md.render(markdown)

        return parse(html, parseOptions);
    }
    
    return (
        <>
            <ContextualCodeEmbed code={content.code} />
            {renderContent(content.markdownContent!)}
        </>
    );
}
