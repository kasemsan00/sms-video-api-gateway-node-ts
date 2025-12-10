$VERSION = git rev-parse --abbrev-ref HEAD
docker build --push -t thspinsoft/sms-video-backend:$VERSION .
docker tag thspinsoft/sms-video-backend:$VERSION registry.kasemsan.com/sms-video/sms-video-backend:$VERSION
docker push registry.kasemsan.com/sms-video/sms-video-backend:$VERSION