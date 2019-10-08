



# About

Project allows to enable **WebP** and **JPEG2000** images on any website, without touching it's source code.

| Next-gen format | Generated with | Runs on Lambda |
|-----------------|----------------|----------------|
| WebP   (webp)   | cwebp (libweb) |     ✅ Yes     |
| JPEG 2000 (jp2) | ImageMagick    |     ✅ Yes     |  

Generation of WebP images is happening on the fly.

System detects support of WebP by listening to "Accept" request header. If it contains 'image/webp' - WebP image will be returned.
For JPEG2000 support, system is checking User-Agent header. In case browser is Safari - JPEG2000 image will be returned.
It is also possible to request WebP or JP2 image explicitly by adding `.mxx.webp` or `.mxx.jp2` to the URL.

Example:
```bash
https://example.com/image.jpg # original image URL
https://example.com/image.jpg.mxx.webp # URL of WebP version of the image. Image will be generated in the fly and cached for 1 year.
https://example.com/image.jpg.mxx.jp2 # URL of JPEG2000 version of the same image. Will be genegated in the fly and cached for 1 year.

When Google Chrome goes to https://example.com/image.jpg - it will be redirected to https://example.com/image.jpg.mxx.webp
When Safari goes to https://example.com/image.jpg - it will be redirected to https://example.com/image.jpg.mxx.jp2

```


There are 3 cache behaviours in the CDN:
![WebP at Edge Architecture](architecture.png?raw=true "Title")
1. If URL ends with .mxx.webp - request will go to image proxy, which will generate WebP image on the fly.
2. If URL ends with .mxx.jp2 - request will go to image proxy, which will generate JPEG2000 image on the fly.
3. All other requests will be forwarded to your website directly.

This is by far the best solution for WebP generation in terms of performance and integration flexibility. 
As an image conversion tool was chosen a native [**cwebp**](https://developers.google.com/speed/webp/download) linux library, as it has shown
around 5% speed improvement over [**Sharp**](https://github.com/lovell/sharp), which is claimed to be faster then ImageMagick.
For JPEG2000, ImageMagick was used, as there are no faster alternatives for this image format yet.
![Sharp and cwebp performance](cwebp_performance.png?raw=true "Title")

# Why?

Next-gen image formats, like **WebP** and **Jpeg 2000** have better compression compared to jpg, png, or gif.
Using nex-gen images on a website will make it faster and improve user experience.
See https://developers.google.com/web/tools/lighthouse/audits/webp



# Requirements

1. Images on your website should be served via AWS CloudFront


# Deployment

**Step 2**. Install dependencies with **npm**:
```bash
npm install
```

**Step 3**. Deploy with **Serverless**
```bash
sls deploy
```
In the end of deployment you will see URL to WebP image generator, for example:
```bash
endpoints:
  GET - https://k1g2tmlk7b.execute-api.us-east-1.amazonaws.com/prod/webp
  GET - https://k1g2tmlk7b.execute-api.us-east-1.amazonaws.com/prod/webp/{proxy+}
```
The value of this output would be needed at the next step

**Step 4** Create 2 origins in your CloudFront distribution, and 2 cache behaviours.

| Origin name | Origin domain | Origin path | Cache behaviour pattern | Cache behaviour options |
|-------------|---------------|-------------|-------------------------|-------------------------|
|    WebP     | {YOUR API GATEWAY DOMAIN FORM STEP 3} | /prod/webp/https://{YOUR WEBSITE DOMAIN} | *.mxx.webp | default |
|    JP2     | {YOUR API GATEWAY DOMAIN FORM STEP 3} | /prod/jp2/https://{YOUR WEBSITE DOMAIN} | *.mxx.jp2 | default |

**Step 5**. Create A Lambda Edge function manually and attach it to your CloudFront distribution.
Source code of the Edge Lambda is in the file *viewer-request.js*.
Note that you need to update it with your domain name. 

**Step 6**. (Optional). Fine-tune which images you want to convert to next-gen formats in 
an viewer-request Lambda Edge function.
By default all images on website are converted. 

# Memory size choice
When choosing a memory size for a Lambda function, for WebP conversion, it's always a choice between performance and cost efficiency.
We recommend 1280Mb, as increasing memory size further does not give significant performance boost. 
![Choosing memory for cwebp](cwebp_memory_choice.png?raw=true "Title")
Watch column "80%". It shows how many milliseconds conversion took on average with different memory settings.
You may increase memory size to 3008Mb, which will make an extra 5% performance boost, and 2.5X cost increase.

With Jpeg2000 situation is a bit different.
It takes ~2 times more time to generate image from same source, and memory consumption is also higher.
![Choosing memory for jpeg2000](jp2_memory_choice.png?raw=true "Title")
We recommend 1536Mb for jpeg2000 lambda function. It's hard to say if performance increases by adding more memory.


# Performance considerations

**Positive performance impact**:
- Size of your images will be decreased in most cases. Users with slow internet connection will benefit the most.
 Example:
 
 ```bash
 # Original - 35Kb
curl -I https://mxx.news/media/website/MXX.jpg -X GET | grep content-
content-type: image/jpeg
content-length: 34973

 # Webp - 14Kb
curl -I https://mxx.news/media/website/MXX.jpg.mxx.webp -X GET | grep content-
content-type: image/webp
content-length: 13770

 # JPEG2000 - 17Kb
curl -I https://mxx.news/media/website/MXX.jpg.mxx.jp2 -X GET | grep content-
content-type: image/jp2
content-length: 16553

 ```

**Negative performance impact**: 
2. @Edge function, connected to Viewer-Request event at Cloudfront slows down every request by ~10ms
3. When there is no converted image in CloudFront, conversion to WebP takes ~650ms for a 82Kb jpeg.
Conversion of same image to Jpeg2000 will take ~1300ms.

# License
- This project - [LICENSE.txt](LICENSE.txt?raw=true "Title")
- ImageMagick - [ImageMagick LICENSE](https://imagemagick.org/script/license.php)
- cwebp - [libweb COPYING](libweb/COPYING?raw=true "Title")