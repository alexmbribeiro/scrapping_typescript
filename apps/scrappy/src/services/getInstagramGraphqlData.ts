import { getId } from '../utils';

const _userAgent = process.env.USER_AGENT;
const _xIgAppId = process.env.X_IG_APP_ID;

if (!_userAgent || !_xIgAppId) {
  console.error("Required headers not found in ENV");
  process.exit(1);
}

export const getInstagramGraphqlData = async (url: string) => {
  const igId = getId(url);
  if (!igId) return "Invalid URL";

  const graphql = new URL(`https://www.instagram.com/api/graphql`);
  graphql.searchParams.set("variables", JSON.stringify({ shortcode: igId }));
  graphql.searchParams.set("doc_id", "10015901848480474");
  graphql.searchParams.set("lsd", "AVqbxe3J_YA");

  const response = await fetch(graphql, {
    method: "POST",
    headers: {
      "User-Agent": _userAgent,
      "Content-Type": "application/x-www-form-urlencoded",
      "X-IG-App-ID": _xIgAppId,
      "X-FB-LSD": "AVqbxe3J_YA",
      "X-ASBD-ID": "129477",
      "Sec-Fetch-Site": "same-origin"
    }
  });

  const json = await response.json();
  const items = json?.data?.xdt_shortcode_media;

  if (!items) return null;

  return {
    //__typename: items?.__typename,
    //shortcode: items?.shortcode,
    //dimensions: items?.dimensions,
    display_url: items?.display_url,
    //display_resources: items?.display_resources,
    //has_audio: items?.has_audio,
    video_url: items?.video_url,
    //video_view_count: items?.video_view_count,
    //video_play_count: items?.video_play_count,
    is_video: items?.is_video,
    //caption: items?.edge_media_to_caption?.edges?.[0]?.node?.text,
    //is_paid_partnership: items?.is_paid_partnership,
    //location: items?.location,
    //owner: items?.owner,
    //product_type: items?.product_type,
    //video_duration: items?.video_duration,
    //thumbnail_src: items?.thumbnail_src,
    //clips_music_attribution_info: items?.clips_music_attribution_info,
    sidecar: items?.edge_sidecar_to_children?.edges,
  };
};

export const getInstagramGraphqlData2 = async (user: string) => {

  const graphql = new URL(`https://i.instagram.com/api/v1/users/web_profile_info/?username={${user}}`);

  const response = await fetch(graphql, {
    method: "GET",
    headers: {
      "x-ig-app-id": "936619743392459",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9,ru;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept": "*/*",
  }
  });

  const json = await response.json();
  const items = json?.data?.xdt_shortcode_media;

  if (!items) return null;

  return {
    __typename: items?.__typename,
    shortcode: items?.shortcode,
    dimensions: items?.dimensions,
    display_url: items?.display_url,
    display_resources: items?.display_resources,
    has_audio: items?.has_audio,
    video_url: items?.video_url,
    video_view_count: items?.video_view_count,
    video_play_count: items?.video_play_count,
    is_video: items?.is_video,
    caption: items?.edge_media_to_caption?.edges?.[0]?.node?.text,
    is_paid_partnership: items?.is_paid_partnership,
    location: items?.location,
    owner: items?.owner,
    product_type: items?.product_type,
    video_duration: items?.video_duration,
    thumbnail_src: items?.thumbnail_src,
    clips_music_attribution_info: items?.clips_music_attribution_info,
    sidecar: items?.edge_sidecar_to_children?.edges,
  };
};