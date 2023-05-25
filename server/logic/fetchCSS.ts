import * as css from "css";
import * as _ from "lodash";
import { IUserAgents } from "../config";
import { asyncRetry } from "../utils/asyncRetry";

const RETRIES = 2;

interface IResource {
  src: string | null;
  fontFamily: string | null;
  fontStyle: string | null;
  fontWeight: string | null;
  url: string;
}

export async function fetchCSS(family: string, cssSubsetString: string, type: keyof IUserAgents, userAgent: string): Promise<IResource[]> {
  const reqPath = `/css?family=${encodeURIComponent(family)}&subset=${cssSubsetString}`;
  const hostname = "fonts.googleapis.com";
  const url = `http://${hostname}${reqPath}`;

  const txt = await asyncRetry(
    async () => {
      const res = await fetch(url, {
        headers: {
          accept: "text/css,*/*;q=0.1",
          "User-Agent": userAgent,
        },
      });

      if (res.status !== 200) {
        throw new Error(`${url} fetchCSS request failed. status code: ${res.status} ${res.statusText}`);
      }

      const contentType = res.headers.get("content-type");

      if (_.isNil(contentType) || _.isEmpty(contentType) || contentType.indexOf("css") === -1) {
        throw new Error(`${url} fetchCSS request failed. expected "css" to be in content-type header: ${contentType}`);
      }

      return res.text();
    },
    { retries: RETRIES }
  );

  return parseRemoteCSS(txt, type);
}

function parseRemoteCSS(remoteCSS: string, type: string): IResource[] {
  const parsedCSS = css.parse(remoteCSS);

  if (_.isNil(parsedCSS.stylesheet)) {
    throw new Error(`parseRemoteCSS: no stylesheets in parsed css for ${type}: ${remoteCSS}`);
  }

  const resources: IResource[] = [];
  _.each(parsedCSS.stylesheet.rules, (rule) => {
    // only font-face rules are relevant...
    if (rule.type !== "font-face") {
      return;
    }

    try {
      const src = getCSSRuleDeclarationPropertyValue(rule, "src");

      if (_.isNil(src)) {
        console.warn(`parseRemoteCSS: no src in parsed css for ${type}: ${remoteCSS}`);
        return;
      }

      const matched = type === "svg" ? src.match("http:\\/\\/[^\\)]+") : src.match("http:\\/\\/[^\\)]+\\." + type);

      if (_.isNil(matched) || matched.length === 0) {
        console.warn(`parseRemoteCSS: no matched url in parsed css for ${type}: ${remoteCSS}`);
        return;
      }

      const resource: IResource = {
        src: getCSSRuleDeclarationPropertyValue(rule, "src"),
        fontFamily: getCSSRuleDeclarationPropertyValue(rule, "font-family"),
        fontStyle: getCSSRuleDeclarationPropertyValue(rule, "font-style"),
        fontWeight: getCSSRuleDeclarationPropertyValue(rule, "font-weight"),
        // extract the url
        url: matched[0],
      };

      // push the current rule (= resource) to the resources array
      resources.push(resource);
    } catch (e) {
      console.error("cannot load resource of type", type, remoteCSS, e);
    }
  });

  return resources;
}

function getCSSRuleDeclarationPropertyValue(rule: css.Rule, property: string): string | null {
  return _.get(
    _.find(rule.declarations, (declaration) => {
      return _.has(declaration, "property") && (<css.Declaration>declaration).property === property;
    }),
    "value",
    null
  );
}
