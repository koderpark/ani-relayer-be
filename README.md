# Ani-Relayer

> **⚠️ This app is under heavy development.**

<img width="1280" height="800" alt="hero" src="https://github.com/user-attachments/assets/f1b5de22-3036-4220-841a-a4512dcecc9b" />

## Getting Started
[Download At Chrome Web Store](https://chromewebstore.google.com/detail/ghmmhbenboneanchpohomkbpiechghkn?utm_source=item-share-cb)

## Summary
laftel에서 제공하고 있는 애니메이션들을, DRM 우회 없이 서로 같이 감상하기 위해 제작했습니다. \
애니메이션 재생시간을 서버에서 관리하고 일괄적으로 propagate해서 같은 시간대에 같은 시점을 볼 수 있게 합니다.

각 참여자들은 모두 laftel서비스에서 제공하는 계정이 존재해야 하며,

**⚠️ laftel과는 관련이 없는 서드파티 프로그램입니다.**

## Stack

- [Plasmo](https://www.plasmo.com/) for the Extension itself.
- [SocketIO](https://socket.io/) for realtime BE communication.
- [Nestjs](https://nestjs.com/) for Backend Server.

## Sequence Diagram - MV3 flow

<img width="862" height="1460" alt="Untitled" src="https://github.com/user-attachments/assets/c2357379-01b9-495b-9bae-18960f9ab804" />
