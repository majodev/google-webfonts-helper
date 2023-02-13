
import * as css from "css";
import * as _ from "lodash";
import { IUserAgents } from "../config";

interface IResource {
  src: string | null;
  fontFamily: string | null;
  fontStyle: string | null;
  fontWeight: string | null;
  url: string;
}

function parseRemoteCSS(remoteCSS, type): IResource[] {
  const parsedCSS = css.parse(remoteCSS);

  const resources = [];
  _.each(parsedCSS.stylesheet.rules, (rule) => {

    // only font-face rules are relevant...
    if (rule.type !== "font-face") {
      return;
    }

    const resource: IResource = {
      src: getCSSRuleDeclarationPropertyValue(rule, "src"),
      fontFamily: getCSSRuleDeclarationPropertyValue(rule, "font-family"),
      fontStyle: getCSSRuleDeclarationPropertyValue(rule, "font-style"),
      fontWeight: getCSSRuleDeclarationPropertyValue(rule, "font-weight"),
      url: null
    };

    try {

      // extract the url
      if (type === "svg") {
        resource.url = resource.src.match("http:\\/\\/[^\\)]+")[0];
      } else {
        resource.url = resource.src.match("http:\\/\\/[^\\)]+\\." + type)[0];
      }

      // push the current rule (= resource) to the resources array
      resources.push(resource);

    } catch (e) {
      console.error("cannot load resource of type", type, resource);
    }

  });

  return resources;
}

function getCSSRuleDeclarationPropertyValue(rule: css.Rule, property: string): string | null {
  return _.get(_.find((rule).declarations, (declaration) => {
    return _.has(declaration, "property")
      && (<css.Declaration>declaration).property === property;
  }), "value");
}

export async function fetchCSS(family: string, cssSubsetString: string, type: keyof IUserAgents, userAgent: string): Promise<IResource[]> {

  const reqPath = '/css?family=' + encodeURIComponent(family) + '&subset=' + cssSubsetString;
  const hostname = "fonts.googleapis.com";
  const url = `http://${hostname}${reqPath}`;

  const res = await fetch(url, {
    headers: {
      'accept': 'text/css,*/*;q=0.1',
      'User-Agent': userAgent
    }
  });

  const txt = await res.text();
  return parseRemoteCSS(txt, type);
}
