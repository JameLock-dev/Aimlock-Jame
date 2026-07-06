

from __future__ import annotations
import json
import sys
import time
import threading
import random
import secrets
import logging
import math
import re
import hashlib
import uuid
import webbrowser
import urllib.parse
import os
import base64
import io
import shutil
import signal
from collections import defaultdict, deque, Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from typing import Any, Dict, Tuple, Optional, List
from getpass import getpass

import pytz
import requests
import websocket
from rich.console import Console, Group
from rich.table import Table
from rich.panel import Panel
from rich.live import Live
from rich.align import Align
from rich.prompt import Prompt, Confirm, IntPrompt, FloatPrompt
from rich.rule import Rule
from rich.text import Text
from rich import box
from rich.columns import Columns
from rich.progress import Progress, SpinnerColumn, BarColumn, TextColumn
from rich.layout import Layout

try:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
except Exception:
    pass

console = Console()
tz = pytz.timezone("Asia/Ho_Chi_Minh")

# ================== GIAO DIỆN TBTOOL ULTIMATE ==================

TBTOOL_COLORS = {
    "gold": "#FFD700",
    "gold_dark": "#B8860B",
    "platinum": "#E5E4E2",
    "diamond": "#B9F2FF",
    "ruby": "#E0115F",
    "emerald": "#50C878",
    "sapphire": "#0F52BA",
    "amethyst": "#9966CC",
    "onyx": "#353839",
    "rose": "#FF007F",
    "neon_blue": "#00D4FF",
    "neon_pink": "#FF00E5",
    "neon_green": "#39FF14",
    "neon_orange": "#FF5E00",
    "crimson": "#DC143C",
    "turquoise": "#40E0D0",
    "lavender": "#E6E6FA",
}

ICONS = {
    "crown": "👑",
    "diamond": "💎",
    "star": "⭐",
    "fire": "🔥",
    "lightning": "⚡",
    "target": "🎯",
    "shield": "🛡️",
    "sword": "⚔️",
    "brain": "🧠",
    "robot": "🤖",
    "rocket": "🚀",
    "trophy": "🏆",
    "medal": "🏅",
    "gem": "💠",
    "sparkle": "✨",
    "settings": "⚙️",
    "user": "👤",
    "key": "🔑",
    "lock": "🔒",
    "unlock": "🔓",
    "check": "✅",
    "cross": "❌",
    "warning": "⚠️",
    "info": "ℹ️",
    "money": "💰",
    "chart": "📊",
    "clock": "⏰",
    "lotto": "🎲",
    "dice": "🎯",
    "plus": "➕",
    "minus": "➖",
    "arrow": "➡️",
    "heart": "❤️",
    "bell": "🔔",
    "gift": "🎁",
    "magic": "🔮",
    "phone": "📞",
    "vip": "💎",
}

LOGO_ULTIMATE = """
╔════════════════════════════════════════════════════════════════════════════╗
║  ████████╗██████╗ ████████╗ ██████╗  ██████╗ ██╗      ██╗   ██╗██╗██████╗ ║
║  ╚══██╔══╝██╔══██╗╚══██╔══╝██╔═══██╗██╔═══██╗██║      ██║   ██║██║██╔══██╗║
║     ██║   ██████╔╝   ██║   ██║   ██║██║   ██║██║      ██║   ██║██║██████╔╝║
║     ██║   ██╔══██╗   ██║   ██║   ██║██║   ██║██║      ╚██╗ ██╔╝██║██╔═══╝ ║
║     ██║   ██████╔╝   ██║   ╚██████╔╝╚██████╔╝███████╗ ╚████╔╝ ██║██║     ║
║     ╚═╝   ╚═════╝    ╚═╝    ╚═════╝  ╚═════╝ ╚══════╝  ╚═══╝  ╚═╝╚═╝     ║
╚════════════════════════════════════════════════════════════════════════════╝
"""

PREMIUM_COLORS = TBTOOL_COLORS
LOGO_PREMIUM = LOGO_ULTIMATE
LOGO_TBTOOL = LOGO_ULTIMATE
LOGO_SMALL = LOGO_ULTIMATE

# ================== HỆ THỐNG KEY ==================

DEVICE_ID_FILE = "device_id_tbtool.txt"
SALT = "TbToolKeySalt2026"
BLOG_URL = "https://webkeytbtool.blogspot.com/2026/06/web-key_0635538465.html?m=0"
TEMP_KEY_FILE = ".temp_key.txt"
ACTIVATION_FILE = "activation_tbtool.dat"
LINK_HISTORY_FILE = "link_history.json"

VUOTNHANH_API = "https://vuotnhanh.com/api"
LINK4M_API = "https://link4m.co/api-shorten/v2"
LINK4M_TOKEN = "690c33d798704a2b646191c1"
VUOTNHANH_TOKEN = "ecc01e96-f2a8-490d-88f9-67683d26b844"

ENCRYPTION_KEY = hashlib.sha256(b"TbTool_SECURE_KEY_2026_XxX_VIP").digest()

# ================== KEY SERVER ==================
KEY_SERVER_URL = "https://key-sever.onrender.com"

# ================== ADMIN KEY ==================
ADMIN_KEY = "TBTOOL_ADMIN_666"

# ================== HÀM MÃ HÓA ==================

def simple_encrypt(data: dict) -> str:
    try:
        json_str = json.dumps(data, sort_keys=True)
        key = ENCRYPTION_KEY
        encrypted = bytearray()
        for i, char in enumerate(json_str.encode('utf-8')):
            encrypted.append(char ^ key[i % len(key)])
        checksum = hashlib.sha256(json_str.encode()).hexdigest()
        result = base64.b64encode(bytes(encrypted)).decode()
        return f"{checksum}:{result}"
    except:
        return ""

def simple_decrypt(encrypted_str: str) -> Optional[dict]:
    try:
        if not encrypted_str:
            return None
        parts = encrypted_str.split(':', 1)
        if len(parts) != 2:
            return None
        stored_checksum, encrypted_data = parts
        key = ENCRYPTION_KEY
        encrypted = base64.b64decode(encrypted_data.encode())
        decrypted = bytearray()
        for i, char in enumerate(encrypted):
            decrypted.append(char ^ key[i % len(key)])
        json_str = decrypted.decode('utf-8')
        if hashlib.sha256(json_str.encode()).hexdigest() != stored_checksum:
            return None
        return json.loads(json_str)
    except:
        return None

# ================== QUẢN LÝ KEY ==================

def get_device_id() -> str:
    if Path(DEVICE_ID_FILE).exists():
        try:
            with open(DEVICE_ID_FILE, "r", encoding="utf-8") as f:
                return f.read().strip()
        except:
            pass
    new_id = str(uuid.uuid4()).replace("-", "")[:32]
    try:
        with open(DEVICE_ID_FILE, "w", encoding="utf-8") as f:
            f.write(new_id)
    except:
        pass
    return new_id

def encrypt_key(device_id: str, key: str) -> str:
    raw = f"{device_id}:{key}:{SALT}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32]

def check_internet_connection() -> bool:
    try:
        requests.get("https://www.google.com", timeout=3)
        return True
    except:
        return False

def get_key_type_and_duration(key: str) -> Tuple[str, int]:
    key = key.strip().upper()
    if re.match(r'^[0-9A-F]{8}$', key):
        return "FREE", 24
    if key.startswith("TBTOOL_VIP_"):
        parts = key.split("_")
        if len(parts) >= 3:
            duration_code = parts[2]
            duration_map = {
                "1D": 24, "3D": 72, "7D": 168, "15D": 360,
                "30D": 720, "6M": 4320, "1Y": 8760, "FOREVER": 87600
            }
            if duration_code in duration_map:
                return "VIP", duration_map[duration_code]
    return "UNKNOWN", 0

def is_vip_activated() -> bool:
    """Kiểm tra user có đang dùng key VIP không"""
    activation = load_activation()
    if not activation:
        return False
    key_type = activation.get("key_type", "FREE")
    return key_type == "VIP"

def is_admin_activated() -> bool:
    """Kiểm tra user có đang dùng key Admin không"""
    activation = load_activation()
    if not activation:
        return False
    return activation.get("key") == ADMIN_KEY

def verify_vip_key_from_server(device_id: str, key: str) -> Optional[Dict]:
    """CHỈ KIỂM TRA KEY VIP TRÊN SERVER - LƯU DEVICE TRÊN SERVER"""
    if not check_internet_connection():
        console.print("[red]❌ Không có kết nối internet![/red]")
        return None
    
    try:
        payload = {
            "device_id": device_id,
            "key": key
        }
        
        url = f"{KEY_SERVER_URL}/api/verify_key"
        console.print(f"[dim]🔗 Đang gửi request đến: {url}[/dim]")
        
        resp = requests.post(url, json=payload, timeout=30)
        
        console.print(f"[dim]📥 Status: {resp.status_code}[/dim]")
        console.print(f"[dim]📥 Response: {resp.text}[/dim]")
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get("success"):
                return {
                    "duration_hours": data.get("duration", 24),
                    "key_type": data.get("key_type", "VIP"),
                    "server_time": data.get("server_time", datetime.now().isoformat()),
                    "is_vip": True,
                    "is_forever": data.get("is_forever", False)
                }
            else:
                console.print(f"[red]❌ Server: {data.get('message')}[/red]")
        else:
            console.print(f"[red]❌ HTTP Lỗi: {resp.status_code}[/red]")
            
        return None
    except requests.exceptions.Timeout:
        console.print("[yellow]⏰ Server đang wake up (mất 50-60s). Vui lòng thử lại![/yellow]")
        console.print("[yellow]💡 Hoặc dùng Uptime Robot để giữ server luôn hoạt động[/yellow]")
        return None
    except Exception as e:
        console.print(f"[red]❌ Lỗi: {e}[/red]")
        return None

def load_link_history() -> dict:
    if Path(LINK_HISTORY_FILE).exists():
        try:
            with open(LINK_HISTORY_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    return {"link": None, "key": None, "device_id": None, "created_at": None}

def save_link_history(link: str, key: str, device_id: str):
    data = {"link": link, "key": key, "device_id": device_id, "created_at": datetime.now().isoformat()}
    try:
        with open(LINK_HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
    except:
        pass

def clear_link_history():
    try:
        if Path(LINK_HISTORY_FILE).exists():
            os.remove(LINK_HISTORY_FILE)
    except:
        pass

def create_free_key_link(device_id: str) -> Optional[str]:
    history = load_link_history()
    if history.get("link") and Path(TEMP_KEY_FILE).exists():
        console.print("[yellow]⚠️ Link Key FREE đã được tạo trước đó:[/yellow]")
        console.print(f"[bold cyan]🔗 {history['link']}[/bold cyan]")
        console.print("[yellow]⏰ Vượt link để lấy Key 8 ký tự[/yellow]")
        console.print("[yellow]⚠️ Key FREE chỉ dùng 1 lần và reset lúc 00h[/yellow]")
        return history["link"]
    if history.get("link") and not Path(TEMP_KEY_FILE).exists():
        clear_link_history()
    secret_key = secrets.token_hex(4)
    encrypted = encrypt_key(device_id, secret_key)
    blog_url = f"{BLOG_URL}?device={device_id}&key={secret_key}"
    try:
        params_4m = {"api": LINK4M_TOKEN, "url": blog_url}
        r1 = requests.get(LINK4M_API, params=params_4m, timeout=10)
        if r1.status_code != 200:
            console.print("[red]❌ Lỗi Link4m.[/red]")
            return None
        data1 = r1.json()
        if data1.get("status") != "success":
            console.print("[red]❌ Lỗi API Link4m.[/red]")
            return None
        link4m_url = data1.get("shortenedUrl")
        params_vn = {"api": VUOTNHANH_TOKEN, "url": link4m_url}
        r2 = requests.get(VUOTNHANH_API, params=params_vn, timeout=10)
        if r2.status_code != 200:
            console.print("[red]❌ Lỗi Vuotnhanh.[/red]")
            return None
        data2 = r2.json()
        if data2.get("status") != "success":
            console.print("[red]❌ Lỗi API Vuotnhanh.[/red]")
            return None
        final_url = data2.get("shortenedUrl")
        with open(TEMP_KEY_FILE, "w", encoding="utf-8") as f:
            f.write(f"{encrypted}\n{final_url}")
        save_link_history(final_url, secret_key, device_id)
        return final_url
    except Exception as e:
        console.print(f"[red]❌ Lỗi: {e}[/red]")
        return None

# ================== HÀM ACTIVATION ==================

def save_activation(device_id: str, key: str, activation_time: datetime, duration_hours: int, key_type: str = "FREE"):
    is_vip = key_type != "FREE"
    is_admin = key == ADMIN_KEY
    data = {
        "device_id": device_id,
        "key": key,
        "key_type": key_type,
        "activation_time": activation_time.isoformat(),
        "expiry_time": (activation_time + timedelta(hours=duration_hours)).isoformat(),
        "duration_hours": duration_hours,
        "is_vip": is_vip,
        "is_admin": is_admin,
        "checksum": hashlib.sha256(f"{device_id}:{key}:{activation_time.isoformat()}:{SALT}".encode()).hexdigest()
    }
    encrypted_data = simple_encrypt(data)
    if encrypted_data:
        try:
            with open(ACTIVATION_FILE, "w", encoding="utf-8") as f:
                f.write(encrypted_data)
            return True
        except:
            pass
    return False

def load_activation() -> Optional[Dict]:
    if not Path(ACTIVATION_FILE).exists():
        return None
    try:
        with open(ACTIVATION_FILE, "r", encoding="utf-8") as f:
            encrypted_data = f.read().strip()
        if not encrypted_data:
            return None
        data = simple_decrypt(encrypted_data)
        if not data:
            try:
                os.remove(ACTIVATION_FILE)
            except:
                pass
            return None
        expected_checksum = hashlib.sha256(
            f"{data.get('device_id', '')}:{data.get('key', '')}:{data.get('activation_time', '')}:{SALT}".encode()
        ).hexdigest()
        if data.get("checksum") != expected_checksum:
            try:
                os.remove(ACTIVATION_FILE)
            except:
                pass
            return None
        return data
    except:
        return None

def check_activation_valid() -> Tuple[bool, Optional[str], bool]:
    activation = load_activation()
    if not activation:
        return False, "Chưa kích hoạt", False
    try:
        current_device = get_device_id()
        if activation.get("device_id") != current_device:
            try:
                os.remove(ACTIVATION_FILE)
                console.print("[red]❌ Device ID không khớp! Key đã dùng trên máy khác.[/red]")
            except:
                pass
            return False, "Device ID không khớp", False
        key_type = activation.get("key_type", "FREE")
        expiry_time = datetime.fromisoformat(activation["expiry_time"])
        now = datetime.now()
        if key_type == "FREE":
            tomorrow = now + timedelta(days=1)
            next_midnight = tomorrow.replace(hour=0, minute=0, second=0, microsecond=0)
            if now >= next_midnight:
                try:
                    os.remove(ACTIVATION_FILE)
                    clear_link_history()
                    if Path(TEMP_KEY_FILE).exists():
                        os.remove(TEMP_KEY_FILE)
                    console.print("[yellow]⏰ Key FREE đã reset lúc 00h! Nhập key mới.[/yellow]")
                except:
                    pass
                return False, "Key FREE đã reset", False
        if now > expiry_time:
            try:
                os.remove(ACTIVATION_FILE)
                console.print("[yellow]⏰ Key đã hết hạn, tự động reset![/yellow]")
            except:
                pass
            return False, "Key đã hết hạn - Đã reset", False
        remaining = expiry_time - now
        days = remaining.total_seconds() / 86400
        hours = remaining.total_seconds() / 3600
        is_vip = activation.get("is_vip", False)
        is_admin = activation.get("is_admin", False)
        if days >= 1:
            return True, f"Còn {days:.1f} ngày", is_vip
        else:
            return True, f"Còn {hours:.1f} giờ", is_vip
    except Exception as e:
        try:
            os.remove(ACTIVATION_FILE)
        except:
            pass
        return False, f"Lỗi: {e}", False

def get_user_key_type() -> str:
    """Lấy loại key của user"""
    activation = load_activation()
    if not activation:
        return "NONE"
    key = activation.get("key", "")
    if key == ADMIN_KEY:
        return "ADMIN"
    return activation.get("key_type", "FREE")

# ================== GIAO DIỆN CHÍNH ==================

def build_logo_with_gradient(logo_text: str) -> Text:
    lines = logo_text.split('\n')
    result = Text()
    for line in lines:
        if line.strip():
            chars = list(line)
            for i, char in enumerate(chars):
                if char in ['█', '╔', '╗', '║', '╚', '╝', '═']:
                    if i % 3 == 0:
                        style = TBTOOL_COLORS["gold"]
                    elif i % 3 == 1:
                        style = TBTOOL_COLORS["neon_blue"]
                    else:
                        style = TBTOOL_COLORS["neon_pink"]
                    result.append(char, style=style)
                else:
                    result.append(char, style="dim")
            result.append("\n")
    return result

def show_ultimate_header():
    logo = build_logo_with_gradient(LOGO_ULTIMATE)
    is_valid, msg, is_vip = check_activation_valid()
    is_admin = is_admin_activated()
    
    if is_admin:
        status_text = "👑 ADMIN"
        status_color = TBTOOL_COLORS["ruby"]
    elif is_vip:
        status_text = "👑 VIP"
        status_color = TBTOOL_COLORS["gold"]
    else:
        status_text = "FREE"
        status_color = TBTOOL_COLORS["neon_blue"]
    
    info = Text.assemble(
        ("\n", ""),
        (f"{ICONS['crown']} ", f"bold {TBTOOL_COLORS['gold']}"),
        ("TBTOOL ULTIMATE", f"bold {TBTOOL_COLORS['neon_blue']}"),
        (f" {status_text}", f"bold {status_color}"),
        (f" {ICONS['crown']}", f"bold {TBTOOL_COLORS['gold']}"),
        ("\n", ""),
        (f"{ICONS['user']} ADMIN: ", "dim"),
        ("Thanh Bình", f"bold {TBTOOL_COLORS['neon_pink']}"),
        ("  |  ", "dim"),
        (f"{ICONS['star']} MOD: ", "dim"),
        ("T.Hưng", f"bold {TBTOOL_COLORS['neon_blue']}"),
        ("\n", ""),
        (f"{ICONS['phone']} ", f"bold {TBTOOL_COLORS['gold']}"),
        ("Liên hệ mua Key VIP: ", "dim"),
        ("0365463767", f"bold {TBTOOL_COLORS['neon_green']}"),
        ("\n", ""),
        (f"{ICONS['clock']} {msg}", f"bold {status_color}" if is_valid else f"bold {TBTOOL_COLORS['ruby']}"),
        ("\n", ""),
    )
    return Panel(Group(Align.center(logo), Align.center(info)), border_style=TBTOOL_COLORS["gold"], box=box.DOUBLE, padding=(0, 2))

def show_key_menu() -> Tuple[bool, Optional[str], bool]:
    is_valid, msg, is_vip = check_activation_valid()
    
    if is_valid:
        vip_text = "VIP " if is_vip else ""
        console.print(Panel(Align.center(Text.assemble(
            (f"{ICONS['unlock']} ", f"bold {TBTOOL_COLORS['emerald']}"),
            (f"ĐÃ KÍCH HOẠT {vip_text}- {msg}", f"bold {TBTOOL_COLORS['gold']}"),
            ("\n", ""), ("Nhấn Enter để tiếp tục", "dim")
        )), border_style=TBTOOL_COLORS["emerald"], box=box.ROUNDED))
        console.print()
        input()
        return True, None, is_vip
    console.clear()
    console.print(show_ultimate_header())
    panel = Panel(Align.center(Text.assemble(
        (f"{ICONS['lock']} ", f"bold {TBTOOL_COLORS['ruby']}"),
        ("KÍCH HOẠT TBTOOL", f"bold {TBTOOL_COLORS['gold']}"),
        (f" {ICONS['lock']}", f"bold {TBTOOL_COLORS['ruby']}"),
        ("\n\n", ""),
        ("[1]  🆓 Tạo Link Key FREE", f"bold {TBTOOL_COLORS['emerald']}"),
        ("[2]  💎 Nhập Key VIP", f"bold {TBTOOL_COLORS['gold']}"),
        ("[3]  👑 Nhập Key ADMIN (chỉ Admin)", f"bold {TBTOOL_COLORS['ruby']}"),
        ("\n\n", ""),
        (f"{ICONS['phone']} Liên hệ mua Key: 0365463767", f"bold {TBTOOL_COLORS['neon_green']}"),
        (f"\n{ICONS['user']} Admin: Thanh Bình", f"bold {TBTOOL_COLORS['neon_pink']}"),
        (f"\n{ICONS['star']} Mod: T.Hưng", f"bold {TBTOOL_COLORS['neon_blue']}"),
    )), border_style=TBTOOL_COLORS["gold"], box=box.DOUBLE, padding=(1, 4))
    console.print(panel)
    console.print()
    
    choice = Prompt.ask(
        f"[bold {TBTOOL_COLORS['gold']}]>> Chọn (1/2/3)[/bold {TBTOOL_COLORS['gold']}]",
        choices=['1', '2', '3'],
        default='1'
    )
    
    if choice == '1':
        # ===== KEY FREE =====
        device_id = get_device_id()
        history = load_link_history()
        temp_key_exists = Path(TEMP_KEY_FILE).exists()
        if history.get("link") and temp_key_exists:
            console.print("[yellow]⚠️ Link Key FREE đã được tạo trước đó:[/yellow]")
            console.print(f"[bold cyan]🔗 {history['link']}[/bold cyan]")
            console.print("[yellow]⏰ Vượt link để lấy Key 8 ký tự[/yellow]")
            console.print("[yellow]⚠️ Key FREE chỉ dùng 1 lần và reset lúc 00h[/yellow]")
            webbrowser.open(history["link"])
        else:
            if history.get("link") and not temp_key_exists:
                console.print("[yellow]⚠️ Phát hiện link cũ nhưng thiếu file key. Tạo lại link mới...[/yellow]")
                clear_link_history()
            console.print("[dim]🔄 Đang tạo link Key FREE...[/dim]")
            link = create_free_key_link(device_id)
            if link:
                console.print(f"\n[green]✅ Link Key FREE đã tạo:[/green]")
                console.print(f"[bold cyan]🔗 {link}[/bold cyan]")
                console.print(f"[cyan]📱 Device ID: {device_id}[/cyan]")
                console.print("[yellow]⚠️ Vượt link để lấy Key 8 ký tự[/yellow]")
                console.print("[yellow]⏰ Key FREE chỉ dùng 1 lần và reset lúc 00h[/yellow]")
                webbrowser.open(link)
            else:
                console.print("[red]❌ Tạo link thất bại![/red]")
                time.sleep(2)
                return False, None, False
        user_key = Prompt.ask(f"\n[bold {TBTOOL_COLORS['gold']}]>> Nhập Key (8 ký tự)[/bold {TBTOOL_COLORS['gold']}]")
        if Path(TEMP_KEY_FILE).exists():
            try:
                with open(TEMP_KEY_FILE, "r", encoding="utf-8") as f:
                    lines = f.read().strip().split("\n")
                    if len(lines) >= 1:
                        stored_encrypted = lines[0]
                    else:
                        console.print("[red]❌ File key lỗi! Vui lòng tạo lại link.[/red]")
                        clear_link_history()
                        if Path(TEMP_KEY_FILE).exists():
                            os.remove(TEMP_KEY_FILE)
                        time.sleep(2)
                        return False, None, False
            except:
                console.print("[red]❌ Lỗi đọc file key! Vui lòng tạo lại link.[/red]")
                clear_link_history()
                if Path(TEMP_KEY_FILE).exists():
                    os.remove(TEMP_KEY_FILE)
                time.sleep(2)
                return False, None, False
            input_encrypted = encrypt_key(device_id, user_key)
            if stored_encrypted == input_encrypted:
                duration = 24
                key_type = "FREE"
                now = datetime.now()
                if save_activation(device_id, user_key, now, duration, key_type):
                    if Path(TEMP_KEY_FILE).exists():
                        os.remove(TEMP_KEY_FILE)
                    clear_link_history()
                    console.print(f"[green]✅ Kích hoạt FREE thành công! Tool hoạt động {duration}h.[/green]")
                    console.print("[yellow]⚠️ Key chỉ dùng 1 lần![/yellow]")
                    console.print("[yellow]⏰ Key FREE sẽ reset lúc 00h mỗi ngày![/yellow]")
                    time.sleep(2)
                    return True, user_key, False
                else:
                    console.print("[red]❌ Lỗi lưu kích hoạt![/red]")
                    time.sleep(2)
                    return False, None, False
            else:
                console.print("[red]❌ Key sai! Vui lòng tạo link mới.[/red]")
                if Path(TEMP_KEY_FILE).exists():
                    os.remove(TEMP_KEY_FILE)
                clear_link_history()
                time.sleep(2)
                return False, None, False
        else:
            console.print("[red]❌ Không tìm thấy file key tạm! Vui lòng tạo lại link.[/red]")
            clear_link_history()
            time.sleep(2)
            return False, None, False
    
    elif choice == '2':
        # ===== KEY VIP =====
        device_id = get_device_id()
        user_key = Prompt.ask(f"[bold {TBTOOL_COLORS['gold']}]>> Nhập Key VIP[/bold {TBTOOL_COLORS['gold']}]")
        
        console.print(f"[dim]🔑 Key đã nhập: {user_key}[/dim]")
        console.print("[dim]🔍 Đang kiểm tra key trên Server...[/dim]")
        
        server_result = verify_vip_key_from_server(device_id, user_key)
        
        if server_result:
            duration = server_result.get("duration_hours", 24)
            key_type = server_result.get("key_type", "VIP")
            is_vip = server_result.get("is_vip", True)
            is_forever = server_result.get("is_forever", False)
            
            now = datetime.now()
            
            if save_activation(device_id, user_key, now, duration, key_type):
                if is_forever:
                    time_text = "VĨNH VIỄN (10 năm)"
                elif duration >= 720:
                    time_text = f"{duration/24:.0f} ngày"
                elif duration >= 168:
                    time_text = f"{duration/24:.0f} ngày"
                elif duration >= 72:
                    time_text = f"{duration/24:.0f} ngày"
                else:
                    time_text = f"{duration} giờ"
                
                console.print(f"[green]✅ Kích hoạt VIP thành công! Tool hoạt động {time_text}.[/green]")
                console.print("[yellow]⚠️ Key chỉ dùng 1 lần![/yellow]")
                console.print("[bold gold]👑 VIP: Đã kích hoạt LOGIC VIP[/bold gold]")
                time.sleep(2)
                return True, user_key, True
            else:
                console.print("[red]❌ Lỗi lưu kích hoạt![/red]")
                time.sleep(2)
                return False, None, False
        else:
            console.print("[red]❌ Key VIP không hợp lệ hoặc đã được sử dụng![/red]")
            console.print("[yellow]💡 Lưu ý:[/yellow]")
            console.print("[yellow]  - Key VIP phải có trong keys.json trên Server[/yellow]")
            console.print("[yellow]  - Mỗi key chỉ dùng được 1 lần cho 1 thiết bị[/yellow]")
            time.sleep(3)
            return False, None, False
    
    elif choice == '3':
        # ===== KEY ADMIN =====
        device_id = get_device_id()
        user_key = Prompt.ask(f"[bold {TBTOOL_COLORS['ruby']}]>> Nhập Key ADMIN[/bold {TBTOOL_COLORS['ruby']}]")
        
        if user_key == ADMIN_KEY:
            now = datetime.now()
            if save_activation(device_id, user_key, now, 87600, "ADMIN"):
                console.print("[green]✅ Kích hoạt ADMIN thành công! Tool hoạt động VĨNH VIỄN.[/green]")
                console.print("[bold red]👑 ADMIN MODE: Đã kích hoạt LOGIC THẦN THÁNH[/bold red]")
                time.sleep(2)
                return True, user_key, True
            else:
                console.print("[red]❌ Lỗi lưu kích hoạt![/red]")
                time.sleep(2)
                return False, None, False
        else:
            console.print("[red]❌ Key ADMIN không hợp lệ![/red]")
            time.sleep(2)
            return False, None, False
    
    return False, None, False

def show_tool_selection() -> str:
    console.clear()
    console.print(show_ultimate_header())
    _, _, is_vip = check_activation_valid()
    is_admin = is_admin_activated()
    
    if is_admin:
        status_text = "👑 ADMIN"
        status_color = TBTOOL_COLORS["ruby"]
    elif is_vip:
        status_text = "👑 VIP"
        status_color = TBTOOL_COLORS["gold"]
    else:
        status_text = "FREE"
        status_color = TBTOOL_COLORS["neon_blue"]
    
    panel = Panel(Align.center(Text.assemble(
        ("\n", ""),
        ("╔═══════════════════════════════════════════════╗\n", TBTOOL_COLORS["gold"]),
        ("║  ", TBTOOL_COLORS["gold"]),
        (f"{ICONS['rocket']} CHỌN TOOL", f"bold {TBTOOL_COLORS['neon_blue']}"),
        ("                          ║\n", TBTOOL_COLORS["gold"]),
        ("╚═══════════════════════════════════════════════╝\n\n", TBTOOL_COLORS["gold"]),
        ("  [1]  ", f"bold {TBTOOL_COLORS['gold']}"),
        (f"{ICONS['shield']} VUA THOÁT HIỂM", f"bold {TBTOOL_COLORS['emerald']}"),
        ("  - Tool auto bet Escape Game\n", "dim"),
        ("  [2]  ", f"bold {TBTOOL_COLORS['gold']}"),
        (f"{ICONS['lotto']} LOTTO", f"bold {TBTOOL_COLORS['neon_pink']}"),
        ("  - Tool phân tích LOTTO\n", "dim"),
        ("\n", ""),
        (f"{ICONS['vip']} ", f"bold {TBTOOL_COLORS['gold']}"),
        (f"Trạng thái: {status_text}", f"bold {status_color}"),
        ("\n", ""),
        (f"{ICONS['brain']} ", f"bold {TBTOOL_COLORS['gold']}"),
        ("Logic độc quyền TBTOOL (chỉ Key VIP/Admin mới dùng được)", f"bold {TBTOOL_COLORS['neon_pink']}"),
        ("\n", ""),
    )), border_style=TBTOOL_COLORS["neon_blue"], box=box.DOUBLE, padding=(1, 4))
    console.print(panel)
    choice = Prompt.ask(f"[bold {TBTOOL_COLORS['gold']}]>> Chọn tool (1/2)[/bold {TBTOOL_COLORS['gold']}]", choices=['1', '2'], default='1')
    return choice

# ================== TOOL 1: VUA THOÁT HIỂM ==================

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

BET_API_URL = "https://api.escapemaster.net/escape_game/bet"
WS_URL = "wss://api.escapemaster.net/escape_master/ws"
WALLET_API_URL = "https://wallet.3games.io/api/wallet/user_asset"

HTTP = requests.Session()
try:
    from requests.adapters import HTTPAdapter
    from urllib3.util.retry import Retry
    adapter = HTTPAdapter(pool_connections=20, pool_maxsize=50, max_retries=Retry(total=3, backoff_factor=0.2, status_forcelist=(500, 502, 503, 504)))
    HTTP.mount("https://", adapter)
    HTTP.mount("http://", adapter)
except Exception:
    pass

ROOM_NAMES = {1: "📦 Nhà kho", 2: "🪑 Phòng họp", 3: "👔 Phòng giám đốc", 4: "💬 Phòng trò chuyện", 5: "🎥 Phòng giám sát", 6: "🏢 Văn phòng", 7: "💰 Phòng tài vụ", 8: "👥 Phòng nhân sự"}
ROOM_ORDER = [1, 2, 3, 4, 5, 6, 7, 8]

USER_ID: Optional[int] = None
SECRET_KEY: Optional[str] = None
IS_VIP_USER: bool = False
IS_ADMIN_USER: bool = False
issue_id: Optional[int] = None
issue_start_ts: Optional[float] = None
issue_end_ts: Optional[float] = None
count_down: Optional[int] = None
killed_room: Optional[int] = None
round_index: int = 0

room_state: Dict[int, Dict[str, Any]] = {r: {"players": 0, "bet": 0} for r in ROOM_ORDER}
room_stats: Dict[int, Dict[str, Any]] = {r: {"kills": 0, "survives": 0, "last_kill_round": None, "last_players": 0, "last_bet": 0} for r in ROOM_ORDER}

predicted_room: Optional[int] = None
last_killed_room: Optional[int] = None
last_killed_room_delayed: Optional[int] = None
prediction_locked: bool = False

current_build: Optional[float] = None
current_usdt: Optional[float] = None
current_world: Optional[float] = None
last_balance_ts: Optional[float] = None
last_balance_val: Optional[float] = None
starting_balance: Optional[float] = None
cumulative_profit: Optional[float] = None

win_streak: int = 0
lose_streak: int = 0
max_win_streak: int = 0
max_lose_streak: int = 0

base_bet: float = 1.0
multiplier: float = 2.0
current_bet: Optional[float] = None
run_mode: str = "AUTO"
bet_rounds_before_skip: int = 0
_rounds_placed_since_skip: int = 0
skip_next_round_flag: bool = False

bet_history: deque = deque(maxlen=200)
bet_sent_for_issue: set = set()

pause_after_losses: int = 0
_skip_rounds_remaining: int = 0
profit_target: Optional[float] = None
stop_when_profit_reached: bool = False
stop_loss_target: Optional[float] = None
stop_when_loss_reached: bool = False
stop_flag: bool = False

ui_state: str = "IDLE"
analysis_duration: float = 45.0
analysis_start_ts: Optional[float] = None

last_msg_ts: float = time.time()
last_balance_fetch_ts: float = 0.0
BALANCE_POLL_INTERVAL: float = 4.0
_ws: Dict[str, Any] = {"ws": None}

_sequential_bet_index = 0
killer_history = deque(maxlen=20)
game_kill_log = deque(maxlen=10)

# ================== 14 LOGIC CHO VUA THOÁT HIỂM ==================
SELECTION_MODES = {
    # Logic FREE (1-9)
    "RANDOM": "1. PHẬT ĐỘ (Random)",
    "MIN_PLAYER_BET": "2. AN TOÀN (Min Players & Bet)",
    "PROBABILITY": "3. XÁC SUẤT (Probability)",
    "FOLLOW_KILLER": "4. THEO SÁT THỦ (Follow Killer)",
    "SEQUENTIAL": "5. TUẦN TỰ (1→2→3→...→8)",
    "KILLER_PERSONALITY": "6. TÍNH CÁCH SÁT THỦ (AI)",
    "SMART_SAFE": "7. THÔNG MINH (AI Smart)",
    "FOLLOW_KILLER_DELAYED": "8. THEO VẾT SÁT THỦ (Delay 1 ván)",
    "HIDE_SEEK_MASTER": "9. THÁNH TRỐN TÌM (Master AI)",
    # Logic VIP (10-13)
    "VIP_RANDOM": "10. VIP RANDOM (Random 9 logic - VIP)",
    "KILLER_WAVE": "11. BẮT SÓNG SÁT THỦ (VIP)",
    "PSYCHO_ANALYSIS": "12. PHÂN TÍCH TÂM LÝ (VIP)",
    "MARKOV_CHAIN": "13. CHUỖI MARKOV (VIP)",
    # Logic ADMIN (14)
    "GOD_MODE": "14. THẦN THÁNH (ADMIN)",
}

settings = {"algo": "RANDOM"}
STRATEGY_CONFIG_FILE = "strategy_tbtool.json"
_spinner = ["📦", "🪑", "👔", "💬", "🎥", "🏢", "💰", "👥"]
_num_re = re.compile(r"-?\d+[\d,]*\.?\d*")
VIP_COLORS = ["#FF00FF", "#D700FF", "#AF00FF", "#8700FF", "#5F00FF", "#0000FF", "#005FFF", "#0087FF", "#00AFFF", "#00D7FF", "#00FFFF"]

# ================== CÁC HÀM HỖ TRỢ VTH ==================

def slow_print(text: str, delay: float = 0.01, style: Optional[str] = None):
    for char in text:
        console.print(Text(char, style=style or "default"), end="")
        time.sleep(delay)
    console.print()

def log_debug(msg: str):
    try:
        logger.debug(msg)
    except Exception:
        pass

def _parse_number(x: Any) -> Optional[float]:
    if x is None:
        return None
    if isinstance(x, (int, float)):
        return float(x)
    s = str(x)
    m = _num_re.search(s)
    if not m:
        return None
    token = m.group(0).replace(",", "")
    try:
        return float(token)
    except Exception:
        return None

def human_ts() -> str:
    return datetime.now(tz).strftime("%Y-%m-%d %H:%M:%S")

def safe_input(prompt: str, default=None, cast=None):
    try:
        s = input(prompt).strip()
    except EOFError:
        return default
    if s == "":
        return default
    if cast:
        try:
            return cast(s)
        except Exception:
            return default
    return s

def _parse_balance_from_json(j: Dict[str, Any]) -> Tuple[Optional[float], Optional[float], Optional[float]]:
    if not isinstance(j, dict):
        return None, None, None
    build = None
    world = None
    usdt = None
    data = j.get("data") if isinstance(j.get("data"), dict) else j
    if isinstance(data, dict):
        cwallet = data.get("cwallet") if isinstance(data.get("cwallet"), dict) else None
        if cwallet:
            for key in ("ctoken_contribute", "ctoken", "build", "balance", "amount"):
                if key in cwallet and build is None:
                    build = _parse_number(cwallet.get(key))
        for k in ("build", "ctoken", "ctoken_contribute"):
            if build is None and k in data:
                build = _parse_number(data.get(k))
        for k in ("usdt", "kusdt", "usdt_balance"):
            if usdt is None and k in data:
                usdt = _parse_number(data.get(k))
        for k in ("world", "xworld"):
            if world is None and k in data:
                world = _parse_number(data.get(k))
    found = []
    def walk(o: Any, path=""):
        if isinstance(o, dict):
            for kk, vv in o.items():
                nk = (path + "." + str(kk)).strip(".")
                if isinstance(vv, (dict, list)):
                    walk(vv, nk)
                else:
                    n = _parse_number(vv)
                    if n is not None:
                        found.append((nk.lower(), n))
        elif isinstance(o, list):
            for idx, it in enumerate(o):
                walk(it, f"{path}[{idx}]")
    walk(j)
    for k, n in found:
        if build is None and any(x in k for x in ("ctoken", "build", "contribute", "balance")):
            build = n
        if usdt is None and "usdt" in k:
            usdt = n
        if world is None and any(x in k for x in ("world", "xworld")):
            world = n
    return build, world, usdt

def balance_headers_for(uid: Optional[int] = None, secret: Optional[str] = None) -> Dict[str, str]:
    h = {"accept": "*/*", "accept-language": "vi,en;q=0.9", "cache-control": "no-cache", "country-code": "vn", "origin": "https://xworld.info", "pragma": "no-cache", "referer": "https://xworld.info/", "user-agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36", "user-login": "login_v2", "xb-language": "vi-VN"}
    if uid is not None:
        h["user-id"] = str(uid)
    if secret:
        h["user-secret-key"] = str(secret)
    return h

def fetch_balances_3games(retries=3, timeout=8, params=None, uid=None, secret=None):
    global current_build, current_usdt, current_world, last_balance_ts, starting_balance, last_balance_val, cumulative_profit
    uid = uid or USER_ID
    secret = secret or SECRET_KEY
    payload = {"user_id": int(uid) if uid is not None else None, "source": "home"}
    attempt = 0
    while attempt <= retries:
        attempt += 1
        try:
            r = HTTP.post(WALLET_API_URL, json=payload, headers=balance_headers_for(uid, secret), timeout=timeout)
            r.raise_for_status()
            j = r.json()
            data = j.get("data", {}) if isinstance(j, dict) else {}
            ua = data.get("user_asset", {}) if isinstance(data, dict) else {}
            build = _parse_number(ua.get("BUILD"))
            world = _parse_number(ua.get("WORLD"))
            usdt = _parse_number(ua.get("USDT"))
            if build is not None:
                if last_balance_val is None:
                    starting_balance = build
                    last_balance_val = build
                else:
                    last_balance_val = build
                current_build = build
                if starting_balance is not None:
                    cumulative_profit = current_build - starting_balance
            if usdt is not None:
                current_usdt = usdt
            if world is not None:
                current_world = world
            last_balance_ts = time.time()
            return current_build, current_world, current_usdt
        except Exception as e:
            log_debug(f"wallet fetch attempt {attempt} error: {e}")
            time.sleep(min(1.5 * attempt, 4))
    return current_build, current_world, current_usdt

# ================== 14 LOGIC CHỌN PHÒNG ==================

# Logic 1: PHẬT ĐỘ
def choose_random() -> int:
    return random.choice(ROOM_ORDER)

# Logic 2: AN TOÀN
def choose_min_player_bet() -> int:
    if not any(rs.get('players', 0) > 0 or rs.get('bet', 0) > 0 for rs in room_state.values()):
        return choose_random()
    player_ranks = sorted(ROOM_ORDER, key=lambda r: room_state[r]['players'])
    bet_ranks = sorted(ROOM_ORDER, key=lambda r: room_state[r]['bet'])
    scores = defaultdict(int)
    for i, r in enumerate(player_ranks):
        scores[r] += i
    for i, r in enumerate(bet_ranks):
        scores[r] += i
    if last_killed_room in scores:
        scores[last_killed_room] += 0.5
    return min(scores, key=scores.get)

# Logic 3: XÁC SUẤT
def choose_probability() -> int:
    scores = {}
    for r in ROOM_ORDER:
        kills = room_stats[r].get('kills', 0)
        survives = room_stats[r].get('survives', 0)
        survival_rate = (survives + 1) / (kills + survives + 2)
        scores[r] = survival_rate
    return max(scores, key=scores.get)

# Logic 4: THEO SÁT THỦ
def choose_follow_killer() -> int:
    if last_killed_room is not None and last_killed_room in ROOM_ORDER:
        console.print(f"[dim]🔪 Theo sát thủ: Đặt phòng {last_killed_room} (vừa bị giết)[/dim]")
        return last_killed_room
    return random.choice(ROOM_ORDER)

# Logic 5: TUẦN TỰ
def choose_sequential() -> int:
    global _sequential_bet_index
    room_to_bet = ROOM_ORDER[_sequential_bet_index]
    _sequential_bet_index = (_sequential_bet_index + 1) % len(ROOM_ORDER)
    return room_to_bet

# Logic 6: TÍNH CÁCH SÁT THỦ
def choose_killer_personality() -> int:
    if not killer_history:
        return choose_random()
    avg_players = sum(h['players'] for h in killer_history) / len(killer_history)
    avg_bet = sum(h['bet'] for h in killer_history) / len(killer_history)
    avoidance_scores = {}
    for r in ROOM_ORDER:
        if r == last_killed_room:
            avoidance_scores[r] = -999999
            continue
        current_players = room_state[r]['players']
        current_bet = room_state[r]['bet']
        player_dist = abs(current_players - avg_players) / (avg_players + 1)
        bet_dist = abs(current_bet - avg_bet) / (avg_bet + 1)
        avoidance_scores[r] = player_dist + bet_dist
    return max(avoidance_scores, key=avoidance_scores.get)

# Logic 7: THÔNG MINH
def choose_smart_safe() -> int:
    scores = {}
    max_players = max(rs['players'] for rs in room_state.values()) or 1
    max_bet = max(rs['bet'] for rs in room_state.values()) or 1
    for r in ROOM_ORDER:
        kills = room_stats[r].get('kills', 0)
        survives = room_stats[r].get('survives', 0)
        survival_rate = (survives + 1) / (kills + survives + 2)
        player_score = 1 - (room_state[r]['players'] / max_players)
        bet_score = 1 - (room_state[r]['bet'] / max_bet)
        last_kill_penalty = 0.5 if r == last_killed_room else 0
        final_score = (0.4 * survival_rate) + (0.3 * player_score) + (0.3 * bet_score) - last_kill_penalty
        scores[r] = final_score
    return max(scores, key=scores.get)

# Logic 8: THEO VẾT SÁT THỦ
def choose_follow_killer_delayed() -> int:
    global last_killed_room_delayed
    if last_killed_room_delayed is not None and last_killed_room_delayed in ROOM_ORDER:
        chosen = last_killed_room_delayed
        console.print(f"[dim]🔍 Theo vết sát thủ: Đặt phòng {chosen} (từ ván trước)[/dim]")
        return chosen
    return random.choice(ROOM_ORDER)

# Logic 9: THÁNH TRỐN TÌM
def choose_hide_seek_master() -> int:
    danger_scores = {}
    max_players = max(rs['players'] for rs in room_state.values()) or 1
    max_bet = max(rs['bet'] for rs in room_state.values()) or 1
    avg_players_killed = 0
    avg_bet_killed = 0
    if killer_history:
        avg_players_killed = sum(h['players'] for h in killer_history) / len(killer_history)
        avg_bet_killed = sum(h['bet'] for h in killer_history) / len(killer_history)
    for r in ROOM_ORDER:
        kills = room_stats[r].get('kills', 0)
        survives = room_stats[r].get('survives', 0)
        hist_danger = (kills + 1) / (kills + survives + 2)
        crowd_danger = room_state[r]['players'] / max_players
        money_danger = room_state[r]['bet'] / max_bet
        personality_danger = 0
        if killer_history:
            player_sim = 1 - (abs(room_state[r]['players'] - avg_players_killed) / (avg_players_killed + max_players + 1))
            bet_sim = 1 - (abs(room_state[r]['bet'] - avg_bet_killed) / (avg_bet_killed + max_bet + 1))
            personality_danger = (player_sim + bet_sim) / 2
        recency_penalty = 1.0 if r == last_killed_room else 0.0
        total_danger = (0.3 * hist_danger) + (0.2 * crowd_danger) + (0.2 * money_danger) + (0.3 * personality_danger) + recency_penalty
        danger_scores[r] = total_danger
    return min(danger_scores, key=danger_scores.get)

# Logic 10: VIP RANDOM
def choose_vip_random() -> int:
    """VIP RANDOM - Random 1 trong 9 logic (1-9) mỗi ván"""
    logic_list = [
        choose_random, choose_min_player_bet, choose_probability,
        choose_follow_killer, choose_sequential, choose_killer_personality,
        choose_smart_safe, choose_follow_killer_delayed, choose_hide_seek_master
    ]
    sys_random = random.SystemRandom()
    chosen_func = sys_random.choice(logic_list)
    logic_names = {
        "choose_random": "Phật Độ",
        "choose_min_player_bet": "An Toàn",
        "choose_probability": "Xác Suất",
        "choose_follow_killer": "Theo Sát Thủ",
        "choose_sequential": "Tuần Tự",
        "choose_killer_personality": "Tính Cách Sát Thủ",
        "choose_smart_safe": "Thông Minh",
        "choose_follow_killer_delayed": "Theo Vết Sát Thủ",
        "choose_hide_seek_master": "Thánh Trốn Tìm",
    }
    display_name = logic_names.get(chosen_func.__name__, chosen_func.__name__)
    console.print(f"[bold gold]👑 VIP Random: Dùng logic {display_name}[/bold gold]")
    return chosen_func()

# Logic 11: BẮT SÓNG SÁT THỦ (VIP)
def choose_killer_wave() -> int:
    """BẮT SÓNG SÁT THỦ - Phân tích chu kỳ sát thủ"""
    if len(game_kill_log) < 4:
        return choose_random()
    
    last_4 = list(game_kill_log)[-4:]
    for i in range(1, 4):
        if len(last_4) >= i*2 and last_4[-i:] == last_4[-i*2:-i]:
            predicted = last_4[-i-1] if len(last_4) > i else last_4[-1]
            console.print(f"[dim]🌊 Bắt sóng: Pattern → dự đoán phòng {predicted}[/dim]")
            return predicted
    return choose_smart_safe()

# Logic 12: PHÂN TÍCH TÂM LÝ (VIP)
def choose_psycho_analysis() -> int:
    """PHÂN TÍCH TÂM LÝ - Đặt ngược xu hướng đám đông"""
    max_players_room = max(ROOM_ORDER, key=lambda r: room_state[r]['players'])
    max_bet_room = max(ROOM_ORDER, key=lambda r: room_state[r]['bet'])
    crowd_favorite = max_players_room if room_state[max_players_room]['players'] > room_state[max_bet_room]['players'] else max_bet_room
    candidates = [r for r in ROOM_ORDER if r != crowd_favorite]
    if candidates:
        return min(candidates, key=lambda r: room_state[r]['players'] + room_state[r]['bet'] * 0.01)
    return choose_random()

# Logic 13: CHUỖI MARKOV (VIP)
def choose_markov_chain() -> int:
    """CHUỖI MARKOV - Dùng xác suất Markov"""
    if len(game_kill_log) < 5:
        return choose_random()
    
    transitions = defaultdict(lambda: defaultdict(int))
    for i in range(len(game_kill_log) - 1):
        current = game_kill_log[i]
        next_room = game_kill_log[i + 1]
        transitions[current][next_room] += 1
    
    last = game_kill_log[-1]
    if transitions[last]:
        predicted = max(transitions[last].items(), key=lambda x: x[1])[0]
        console.print(f"[dim]📊 Markov: Từ phòng {last} → dự đoán phòng {predicted}[/dim]")
        return predicted
    return choose_smart_safe()

# Logic 14: THẦN THÁNH (ADMIN)
def choose_god_mode() -> int:
    """THẦN THÁNH - Chỉ ADMIN mới dùng được - Tỷ lệ thắng cao"""
    # Phân tích toàn diện
    scores = {}
    for r in ROOM_ORDER:
        kills = room_stats[r].get('kills', 0)
        survives = room_stats[r].get('survives', 0)
        
        # Tỷ lệ sống sót
        survival_rate = (survives + 1) / (kills + survives + 2)
        
        # Mức độ đông đúc (càng đông càng nguy hiểm)
        crowd_factor = 1 - (room_state[r]['players'] / max(1, max(rs['players'] for rs in room_state.values())))
        
        # Mức độ tiền cược (càng nhiều tiền càng nguy hiểm)
        money_factor = 1 - (room_state[r]['bet'] / max(1, max(rs['bet'] for rs in room_state.values())))
        
        # Tránh phòng vừa bị giết
        recency_penalty = -1.0 if r == last_killed_room else 0
        
        # Trọng số
        score = (0.5 * survival_rate) + (0.3 * crowd_factor) + (0.2 * money_factor) + recency_penalty
        scores[r] = score
    
    # Chọn phòng có điểm cao nhất
    chosen = max(scores, key=scores.get)
    console.print(f"[bold red]👑 GOD MODE: Chọn phòng {chosen} (tỷ lệ thắng cao nhất)[/bold red]")
    return chosen

def choose_room_tn(mode: str) -> Tuple[int, str]:
    mode = mode.upper()
    logic_map = {
        "RANDOM": choose_random,
        "MIN_PLAYER_BET": choose_min_player_bet,
        "PROBABILITY": choose_probability,
        "FOLLOW_KILLER": choose_follow_killer,
        "SEQUENTIAL": choose_sequential,
        "KILLER_PERSONALITY": choose_killer_personality,
        "SMART_SAFE": choose_smart_safe,
        "FOLLOW_KILLER_DELAYED": choose_follow_killer_delayed,
        "HIDE_SEEK_MASTER": choose_hide_seek_master,
        "VIP_RANDOM": choose_vip_random,
        "KILLER_WAVE": choose_killer_wave,
        "PSYCHO_ANALYSIS": choose_psycho_analysis,
        "MARKOV_CHAIN": choose_markov_chain,
        "GOD_MODE": choose_god_mode,
    }
    func = logic_map.get(mode, choose_random)
    chosen_room = func()
    return chosen_room, mode

# ================== API VÀ ĐẶT CƯỢC VTH ==================

def api_headers() -> Dict[str, str]:
    return {"content-type": "application/json", "user-agent": "Mozilla/5.0", "user-id": str(USER_ID) if USER_ID else "", "user-secret-key": SECRET_KEY if SECRET_KEY else ""}

def place_bet_http(issue: int, room_id: int, amount: float) -> dict:
    payload = {"asset_type": "BUILD", "user_id": USER_ID, "room_id": int(room_id), "bet_amount": float(amount)}
    try:
        r = requests.post(BET_API_URL, headers=api_headers(), json=payload, timeout=8)
        try:
            return r.json()
        except Exception:
            return {"raw": r.text, "http_status": r.status_code}
    except Exception as e:
        return {"error": str(e)}

def record_bet(issue: int, room_id: int, amount: float, resp: dict, algo_used: Optional[str] = None) -> dict:
    now = datetime.now(tz).strftime("%H:%M:%S")
    rec = {"issue": issue, "room": room_id, "amount": float(amount), "time": now, "resp": resp, "result": "Đang", "algo": algo_used, "delta": 0.0, "win_streak": win_streak, "lose_streak": lose_streak}
    bet_history.append(rec)
    return rec

def place_bet_async(issue: int, room_id: int, amount: float, algo_used: Optional[str] = None):
    def worker():
        console.print(f"[cyan]Đang đặt {amount} BUILD -> PHÒNG_{room_id} (v{issue}) — Thuật toán: {algo_used}[/]")
        time.sleep(random.uniform(0.05, 0.45))
        res = place_bet_http(issue, room_id, amount)
        rec = record_bet(issue, room_id, amount, res, algo_used=algo_used)
        if isinstance(res, dict) and (res.get("msg") == "ok" or res.get("code") == 0 or res.get("status") in ("ok", 1)):
            bet_sent_for_issue.add(issue)
            console.print(f"[green]✅ Đặt thành công {amount} BUILD vào PHÒNG_{room_id} (v{issue}).[/]")
        else:
            console.print(f"[red]❌ Đặt lỗi v{issue}: {res}[/]")
    threading.Thread(target=worker, daemon=True).start()

def lock_prediction_if_needed(force: bool = False):
    global prediction_locked, predicted_room, ui_state, current_bet, _rounds_placed_since_skip, skip_next_round_flag, _skip_rounds_remaining, stop_flag
    
    if stop_flag:
        return
    if prediction_locked and not force:
        return
    if issue_id is None:
        return
    
    mode = settings.get("algo", "RANDOM")
    is_vip = is_vip_activated()
    is_admin = is_admin_activated()
    
    # KIỂM TRA QUYỀN SỬ DỤNG LOGIC
    if mode in ["VIP_RANDOM", "KILLER_WAVE", "PSYCHO_ANALYSIS", "MARKOV_CHAIN"]:
        if not is_vip and not is_admin:
            console.print("[red]❌ Logic VIP chỉ dành cho Key VIP! Chuyển sang RANDOM.[/red]")
            mode = "RANDOM"
            settings["algo"] = "RANDOM"
    
    if mode == "GOD_MODE":
        if not is_admin:
            console.print("[red]❌ LOGIC THẦN THÁNH chỉ dành cho ADMIN! Chuyển sang RANDOM.[/red]")
            mode = "RANDOM"
            settings["algo"] = "RANDOM"
    
    chosen, algo_used = choose_room_tn(mode)
    predicted_room = chosen
    prediction_locked = True
    ui_state = "PREDICTED"
    
    if _skip_rounds_remaining > 0:
        console.print(f"[yellow]⏸️ Đang nghỉ {_skip_rounds_remaining} ván theo cấu hình sau khi thua.[/]")
        _skip_rounds_remaining -= 1
        return
    if skip_next_round_flag:
        console.print("[yellow]⏸️ TẠM DỪNG THEO DÕI SÁT THỦ[/]")
        skip_next_round_flag = False
        return
    if run_mode == "AUTO":
        bld = current_build
        if bld is None:
            bld, _, _ = fetch_balances_3games(retries=1, timeout=3)
            if bld is None:
                console.print("[yellow]⚠️ Không lấy được số dư, không thể đặt cược. Sẽ thử lại...[/]")
                prediction_locked = False
                ui_state = "ANALYZING"
                return
        if current_bet is None:
            current_bet = base_bet
        amt = float(current_bet)
        if amt <= 0:
            console.print("[yellow]⚠️ Số tiền đặt không hợp lệ (<=0). Bỏ qua.[/]")
            return
        if amt > bld:
            console.print(f"[red]🔥 VỐN KHÔNG ĐỦ ĐỂ GẤP THẾP! Cần {amt:,.2f} nhưng chỉ có {bld:,.2f}. Reset về cược gốc.[/red]")
            current_bet = base_bet
            amt = float(current_bet)
            if amt > bld:
                console.print(f"[red]💀 Vốn không đủ để đặt cược gốc ({amt:,.2f}). Dừng tool.[/red]")
                stop_flag = True
                return
        place_bet_async(issue_id, predicted_room, amt, algo_used=algo_used)
        _rounds_placed_since_skip += 1
        if bet_rounds_before_skip > 0 and _rounds_placed_since_skip >= bet_rounds_before_skip:
            skip_next_round_flag = True
            _rounds_placed_since_skip = 0

# ================== WEBSOCKET VTH ==================

def safe_send_enter_game(ws):
    if not ws:
        log_debug("safe_send_enter_game: ws None")
        return
    try:
        payload = {"msg_type": "handle_enter_game", "asset_type": "BUILD", "user_id": USER_ID, "user_secret_key": SECRET_KEY}
        ws.send(json.dumps(payload))
        log_debug("Sent enter_game")
    except Exception as e:
        log_debug(f"safe_send_enter_game err: {e}")

def _extract_issue_id(d: Dict[str, Any]) -> Optional[int]:
    if not isinstance(d, dict):
        return None
    possible = []
    for key in ("issue_id", "issueId", "issue", "id"):
        v = d.get(key)
        if v is not None:
            possible.append(v)
    if isinstance(d.get("data"), dict):
        for key in ("issue_id", "issueId", "issue", "id"):
            v = d["data"].get(key)
            if v is not None:
                possible.append(v)
    for p in possible:
        try:
            return int(p)
        except Exception:
            try:
                return int(str(p))
            except Exception:
                continue
    return None

def on_open(ws):
    _ws["ws"] = ws
    console.print("[green]ĐANG TRUY CẬP DỮ LIỆU GAME[/]")
    safe_send_enter_game(ws)

def on_message(ws, message):
    global issue_id, count_down, killed_room, round_index, ui_state, analysis_start_ts, issue_start_ts, issue_end_ts
    global prediction_locked, predicted_room, last_killed_room, last_killed_room_delayed, last_msg_ts, current_bet
    global win_streak, lose_streak, max_win_streak, max_lose_streak, cumulative_profit, _skip_rounds_remaining, stop_flag
    
    last_msg_ts = time.time()
    try:
        if isinstance(message, bytes):
            try:
                message = message.decode("utf-8", errors="replace")
            except Exception:
                message = str(message)
        data = None
        try:
            data = json.loads(message)
        except Exception:
            try:
                data = json.loads(message.replace("'", '"'))
            except Exception:
                log_debug(f"on_message non-json: {str(message)[:200]}")
                return
        if isinstance(data, dict) and isinstance(data.get("data"), str):
            try:
                inner = json.loads(data.get("data"))
                merged = dict(data)
                merged.update(inner)
                data = merged
            except Exception:
                pass
        msg_type = data.get("msg_type") or data.get("type") or ""
        msg_type = str(msg_type)
        new_issue = _extract_issue_id(data)
        if msg_type == "notify_enter_game":
            info = data.get("info", {})
            if isinstance(info, dict):
                if info.get("start_time"):
                    st = float(info.get("start_time"))
                    if st > time.time() * 500: st /= 1000.0
                    issue_start_ts = st
                if info.get("end_time"):
                    et = float(info.get("end_time"))
                    if et > time.time() * 500: et /= 1000.0
                    issue_end_ts = et
            if data.get("last_killed_room_id"):
                last_killed_room = int(data["last_killed_room_id"])
            room_stat = data.get("room_stat", [])
            if isinstance(room_stat, list):
                for rm in room_stat:
                    _process_room_update(rm)
        if msg_type == "notify_issue_stat" or "issue_stat" in msg_type:
            rooms = data.get("rooms") or []
            if not rooms and isinstance(data.get("data"), dict):
                rooms = data["data"].get("rooms", [])
            for rm in (rooms or []):
                _process_room_update(rm)
                try:
                    rid = int(rm.get("room_id") or rm.get("roomId") or rm.get("id"))
                except Exception:
                    continue
                players = int(rm.get("user_cnt") or rm.get("userCount") or 0) or 0
                bet = int(rm.get("total_bet_amount") or rm.get("totalBet") or rm.get("bet") or 0) or 0
                room_state[rid] = {"players": players, "bet": bet}
                room_stats[rid]["last_players"] = players
                room_stats[rid]["last_bet"] = bet
            if new_issue is not None and new_issue != issue_id:
                log_debug(f"New issue: {issue_id} -> {new_issue}")
                issue_id = new_issue
                if data.get("start_time"):
                    st = float(data.get("start_time"))
                    if st > time.time() * 500: st /= 1000.0
                    issue_start_ts = st
                else:
                    issue_start_ts = time.time()
                issue_end_ts = issue_start_ts + 60.0
                round_index += 1
                killed_room = None
                prediction_locked = False
                predicted_room = None
                ui_state = "ANALYZING"
                analysis_start_ts = time.time()
        elif msg_type == "notify_count_down" or "count_down" in msg_type:
            count_down = data.get("count_down") or data.get("countDown") or data.get("count") or count_down
            try:
                count_val = int(count_down)
            except Exception:
                count_val = None
            if count_val is not None and count_val <= 10 and not prediction_locked:
                lock_prediction_if_needed()
        elif msg_type == "notify_result" or "result" in msg_type:
            kr = None
            possible_keys = ["killed_room", "killed_room_id", "killedRoom", "killedRoomId", "kill_room"]
            for key in possible_keys:
                if data.get(key) is not None:
                    kr = data.get(key)
                    break
            if kr is None and isinstance(data.get("data"), dict):
                for key in possible_keys:
                    if data["data"].get(key) is not None:
                        kr = data["data"].get(key)
                        break
            if kr is not None:
                try:
                    krid = int(kr)
                except Exception:
                    krid = kr
                killed_room = krid
                game_kill_log.append(krid)
                update_killer_history(krid)
                last_killed_room = krid
                if last_killed_room_delayed is None:
                    last_killed_room_delayed = krid
                else:
                    last_killed_room_delayed = krid
                for rid in ROOM_ORDER:
                    if rid == krid:
                        room_stats[rid]["kills"] += 1
                        room_stats[rid]["last_kill_round"] = round_index
                    else:
                        room_stats[rid]["survives"] += 1
                balance_before_payout = current_build
                rec = None
                for b in reversed(bet_history):
                    if b.get("issue") == issue_id:
                        rec = b
                        break
                if rec is not None:
                    try:
                        placed_room = int(rec.get("room"))
                        if placed_room != int(killed_room):
                            rec["result"] = "Thắng"
                            current_bet = base_bet
                            win_streak += 1
                            lose_streak = 0
                            if win_streak > max_win_streak:
                                max_win_streak = win_streak
                        else:
                            rec["result"] = "Thua"
                            try:
                                if current_bet is not None:
                                    current_bet *= float(multiplier)
                            except Exception:
                                current_bet = base_bet
                            lose_streak += 1
                            win_streak = 0
                            if lose_streak > max_lose_streak:
                                max_lose_streak = lose_streak
                            if pause_after_losses > 0:
                                _skip_rounds_remaining = pause_after_losses
                        threading.Thread(target=_background_update_balance_after_result, args=(rec, balance_before_payout), daemon=True).start()
                        rec["win_streak"] = win_streak
                        rec["lose_streak"] = lose_streak
                    except Exception as e:
                        log_debug(f"result handle err: {e}")
            ui_state = "RESULT"
            try:
                if stop_when_profit_reached and profit_target is not None and isinstance(current_build, (int, float)) and current_build >= profit_target and not stop_flag:
                    console.print(f"[bold green]🎉 MỤC TIÊU LÃI ĐẠT: {current_build} >= {profit_target}. Dừng tool.[/]")
                    stop_flag = True
                    try:
                        wsobj = _ws.get("ws")
                        if wsobj:
                            wsobj.close()
                    except Exception:
                        pass
                if stop_when_loss_reached and stop_loss_target is not None and isinstance(current_build, (int, float)) and current_build <= stop_loss_target and not stop_flag:
                    console.print(f"[bold red]💀 CẮT LỖ: {current_build:,.2f} <= {stop_loss_target:,.2f}. Dừng tool.[/]")
                    stop_flag = True
                    try:
                        wsobj = _ws.get("ws")
                        if wsobj:
                            wsobj.close()
                    except Exception:
                        pass
            except Exception:
                pass
    except Exception as e:
        log_debug(f"on_message err: {e}")

def _background_update_balance_after_result(rec: dict, balance_before: Optional[float]):
    global cumulative_profit
    try:
        time.sleep(2.5)
        new_balance, _, _ = fetch_balances_3games(retries=2, timeout=5)
        if rec and isinstance(new_balance, (int, float)):
            if isinstance(balance_before, (int, float)):
                delta = new_balance - balance_before
                rec['delta'] = delta
            else:
                if rec.get('result') == 'Thắng':
                    rec['delta'] = float(rec.get('amount', 0)) * 7
                elif rec.get('result') == 'Thua':
                    rec['delta'] = -float(rec.get('amount', 0))
    except Exception as e:
        log_debug(f"Error in background balance update: {e}")

def update_killer_history(killed_room_id):
    if killed_room_id in room_state:
        killer_history.append({'players': room_state[killed_room_id].get('players', 0), 'bet': room_state[killed_room_id].get('bet', 0)})

def _process_room_update(room_data: dict):
    if not isinstance(room_data, dict):
        return
    try:
        rid = int(room_data.get("room_id") or room_data.get("roomId") or room_data.get("id"))
        players = int(room_data.get("user_cnt") or room_data.get("userCount") or 0) or 0
        bet = _parse_number(room_data.get("total_bet_amount") or room_data.get("totalBet") or room_data.get("bet") or 0) or 0
        room_state[rid] = {"players": players, "bet": bet}
        room_stats[rid]["last_players"] = players
        room_stats[rid]["last_bet"] = bet
    except (ValueError, TypeError):
        pass

def on_close(ws, code, reason):
    log_debug(f"WS closed: {code} {reason}")

def on_error(ws, err):
    log_debug(f"WS error: {err}")

def start_ws():
    backoff = 1.0
    while not stop_flag:
        try:
            ws_app = websocket.WebSocketApp(WS_URL, on_open=on_open, on_message=on_message, on_close=on_close, on_error=on_error)
            _ws["ws"] = ws_app
            ws_app.run_forever(ping_interval=15, ping_timeout=6)
        except Exception as e:
            log_debug(f"start_ws exception: {e}")
        t = min(backoff + random.random() * 0.8, 30)
        log_debug(f"Reconnect WS after {t}s")
        time.sleep(t)
        backoff = min(backoff * 1.8, 30)

class BalancePoller(threading.Thread):
    def __init__(self, uid: Optional[int], secret: Optional[str], poll_seconds: int = 2, on_balance=None, on_error=None, on_status=None):
        super().__init__(daemon=True)
        self.uid = uid
        self.secret = secret
        self.poll_seconds = max(1, int(poll_seconds))
        self._running = True
        self._last_balance_local: Optional[float] = None
        self.on_balance = on_balance
        self.on_error = on_error
        self.on_status = on_status

    def stop(self):
        self._running = False

    def run(self):
        if self.on_status:
            self.on_status("Kết nối...")
        while self._running and not stop_flag:
            try:
                build, world, usdt = fetch_balances_3games(params={"userId": str(self.uid)} if self.uid else None, uid=self.uid, secret=self.secret)
                if build is None:
                    raise RuntimeError("Không đọc được balance từ response")
                delta = 0.0 if self._last_balance_local is None else (build - self._last_balance_local)
                first_time = (self._last_balance_local is None)
                if first_time or abs(delta) > 0:
                    self._last_balance_local = build
                    if self.on_balance:
                        self.on_balance(float(build), float(delta), {"ts": human_ts()})
                    if self.on_status:
                        self.on_status("Đang theo dõi")
                else:
                    if self.on_status:
                        self.on_status("Đang theo dõi (không đổi)")
            except Exception as e:
                if self.on_error:
                    self.on_error(str(e))
                if self.on_status:
                    self.on_status("Lỗi kết nối (thử lại...)")
            for _ in range(max(1, int(self.poll_seconds * 5))):
                if not self._running or stop_flag:
                    break
                time.sleep(0.2)
        if self.on_status:
            self.on_status("Đã dừng")

def monitor_loop():
    global last_balance_fetch_ts, last_msg_ts, stop_flag
    while not stop_flag:
        now = time.time()
        if now - last_balance_fetch_ts >= BALANCE_POLL_INTERVAL:
            last_balance_fetch_ts = now
            try:
                fetch_balances_3games(params={"userId": str(USER_ID)} if USER_ID else None)
            except Exception as e:
                log_debug(f"monitor fetch err: {e}")
        if now - last_msg_ts > 12:
            log_debug("No ws msg >12s, send enter_game")
            try:
                safe_send_enter_game(_ws.get("ws"))
            except Exception as e:
                log_debug(f"monitor send err: {e}")
        if now - last_msg_ts > 45:
            log_debug("No ws msg >45s, force reconnect")
            try:
                wsobj = _ws.get("ws")
                if wsobj:
                    try:
                        wsobj.close()
                    except Exception:
                        pass
            except Exception:
                pass
        try:
            if analysis_start_ts and (time.time() - analysis_start_ts >= analysis_duration) and not prediction_locked:
                lock_prediction_if_needed()
        except Exception:
            pass
        time.sleep(0.6)

def _spinner_char():
    return _spinner[int(time.time() * 4) % len(_spinner)]

def _rainbow_border_style() -> str:
    idx = int(time.time() * 4) % len(VIP_COLORS)
    return VIP_COLORS[idx]

# ================== GIAO DIỆN GAME VTH ==================

def build_premium_header():
    logo_text = build_logo_with_gradient(LOGO_SMALL)
    info_table = Table(box=None, show_header=False, pad_edge=False, expand=True)
    info_table.add_column(style=f"bold {TBTOOL_COLORS['gold']}", no_wrap=True, justify="right", width=18)
    info_table.add_column(style="white")
    info_table.add_row(f"{ICONS['user']} USER:", f"[bold {TBTOOL_COLORS['platinum']}]{USER_ID}[/bold {TBTOOL_COLORS['platinum']}]" if USER_ID else "[dim]-[/dim]")
    b = f"{current_build:,.2f}" if isinstance(current_build, (int, float)) else "0.00"
    info_table.add_row(f"{ICONS['diamond']} BALANCE:", f"[bold {TBTOOL_COLORS['emerald']}]{b}[/bold {TBTOOL_COLORS['emerald']}] BUILD")
    pnl_val = cumulative_profit if cumulative_profit is not None else 0
    if pnl_val > 0:
        pnl_color = TBTOOL_COLORS["emerald"]
        pnl_icon = "📈"
    elif pnl_val < 0:
        pnl_color = TBTOOL_COLORS["ruby"]
        pnl_icon = "📉"
    else:
        pnl_color = TBTOOL_COLORS["gold"]
        pnl_icon = "➖"
    info_table.add_row(f"{ICONS['fire']} P&L:", f"[{pnl_color}]{pnl_icon} {pnl_val:+,.2f}[/{pnl_color}] BUILD")
    streak_text = Text.assemble(("🔥 ", f"bold {TBTOOL_COLORS['neon_orange']}"), (f"{win_streak}", f"bold {TBTOOL_COLORS['emerald']}"), (" | ", "dim"), ("💀 ", f"bold {TBTOOL_COLORS['ruby']}"), (f"{lose_streak}", f"bold {TBTOOL_COLORS['ruby']}"))
    info_table.add_row("📊 STREAK:", streak_text)
    algo_label = SELECTION_MODES.get(settings.get('algo'), settings.get('algo'))
    info_table.add_row(f"{ICONS['brain']} AI:", f"[bold {TBTOOL_COLORS['neon_pink']}]{algo_label}[/bold {TBTOOL_COLORS['neon_pink']}]")
    now_str = datetime.now(tz).strftime("%H:%M:%S")
    info_table.add_row(f"{ICONS['clock']} TIME:", f"[{TBTOOL_COLORS['sapphire']}]{now_str}[/{TBTOOL_COLORS['sapphire']}]")
    info_table.add_row(f"{ICONS['target']} ROUND:", f"[bold {TBTOOL_COLORS['gold']}]{issue_id or 'Waiting...'}[/bold {TBTOOL_COLORS['gold']}]")
    content = Group(Align.center(logo_text), info_table)
    return Panel(content, border_style=TBTOOL_COLORS["gold"], box=box.HEAVY, padding=(1, 2))

def build_premium_rooms():
    room_panels = []
    for r in ROOM_ORDER:
        st = room_state.get(r, {})
        players = st.get("players", 0)
        bet_val = st.get('bet', 0) or 0
        is_predicted = predicted_room is not None and int(r) == int(predicted_room)
        is_killed = killed_room is not None and int(r) == int(killed_room)
        if is_killed and is_predicted:
            border = f"bold {TBTOOL_COLORS['ruby']}"
            title_style = f"bold {TBTOOL_COLORS['ruby']}"
            bg = "on #330000"
            glow = "💀⚡🔥"
        elif is_killed:
            border = TBTOOL_COLORS["ruby"]
            title_style = TBTOOL_COLORS["ruby"]
            bg = "on #1a0000"
            glow = "💀"
        elif is_predicted:
            border = f"bold {TBTOOL_COLORS['emerald']}"
            title_style = f"bold {TBTOOL_COLORS['emerald']}"
            bg = "on #003300"
            glow = "✨⭐"
        else:
            border = TBTOOL_COLORS["onyx"]
            title_style = "white"
            bg = ""
            glow = ""
        content = Text.assemble(("\n", ""), (f"{glow} ", "default"), (f"👥 {players:3d} ", "white"), ("| ", "dim"), (f"💰 {int(bet_val):,}", TBTOOL_COLORS["gold"]), ("\n", ""), justify="center")
        room_panel = Panel(Align.center(content, vertical="middle"), title=f"[{title_style}]{ROOM_NAMES.get(r, f'Room {r}')}[/{title_style}]", border_style=border, box=box.HEAVY, expand=True, height=5, style=bg)
        room_panels.append(room_panel)
    return Panel(Columns(room_panels, equal=True, expand=True), title=f"[bold {TBTOOL_COLORS['gold']}]🎮 PREMIUM BATTLE ARENA 🎮[/bold {TBTOOL_COLORS['gold']}]", box=box.HEAVY, border_style=TBTOOL_COLORS["gold"], expand=True)

def build_premium_mid():
    global analysis_start_ts
    if ui_state == "ANALYZING":
        now = time.time()
        elapsed = now - (analysis_start_ts or now)
        progress = min(1.0, elapsed / analysis_duration)
        neurons = ["⚪", "🟢", "🔵", "🟣", "🟡"]
        active_neurons = int(progress * len(neurons))
        neural_net = " ".join(neurons[:active_neurons] + ["◯"] * (len(neurons) - active_neurons))
        lines = [f"\n[bold {TBTOOL_COLORS['neon_blue']}]🧠 AI NEURAL NETWORK ANALYZING[/bold {TBTOOL_COLORS['neon_blue']}]", f"\n[{TBTOOL_COLORS['gold']}]{neural_net}[/{TBTOOL_COLORS['gold']}]", f"\n[{TBTOOL_COLORS['neon_pink']}]Progress: {progress*100:3.0f}%[/{TBTOOL_COLORS['neon_pink']}]"]
        bar_width = 40
        filled = int(bar_width * progress)
        bar = "█" * filled + "░" * (bar_width - filled)
        lines.append(f"[{TBTOOL_COLORS['gold']}]├[/{TBTOOL_COLORS['gold']}] {bar}")
        if issue_end_ts and now < issue_end_ts:
            remaining = int(issue_end_ts - now)
            lines.append(f"\n⏳ [bold {TBTOOL_COLORS['gold']}]Time remaining: {remaining}s[/bold {TBTOOL_COLORS['gold']}]")
        return Panel(Text.from_markup("\n".join(lines)), border_style=TBTOOL_COLORS["neon_pink"], box=box.HEAVY, padding=(1, 2), expand=True)
    elif ui_state == "PREDICTED":
        name = ROOM_NAMES.get(predicted_room, f"Room {predicted_room}") if predicted_room else '?'
        bet_amt = f"{current_bet:,.2f}" if current_bet is not None else '0'
        content = Text.assemble(("\n", ""), ("╔══════════════════════════════════════════╗\n", TBTOOL_COLORS["gold"]), ("║  🎯  TARGET LOCKED  🎯                  ║\n", TBTOOL_COLORS["gold"]), ("║  ", TBTOOL_COLORS["gold"]), (f"{name:^28}", f"bold {TBTOOL_COLORS['emerald']}"), ("  ║\n", TBTOOL_COLORS["gold"]), ("║  💰 ", TBTOOL_COLORS["gold"]), (f"{bet_amt:^26}", f"bold {TBTOOL_COLORS['gold']}"), (" BUILD  ║\n", TBTOOL_COLORS["gold"]), ("╚══════════════════════════════════════════╝\n", TBTOOL_COLORS["gold"]), ("\n", ""), ("☠️ Last Kill: ", ""), (f"{ROOM_NAMES.get(last_killed_room, '-')}", f"bold {TBTOOL_COLORS['ruby']}"), ("  |  📈 Win: ", ""), (f"{win_streak}", f"bold {TBTOOL_COLORS['emerald']}"), ("  |  📉 Lose: ", ""), (f"{lose_streak}", f"bold {TBTOOL_COLORS['ruby']}"))
        return Panel(Align.center(content), border_style=TBTOOL_COLORS["emerald"], box=box.HEAVY, padding=1, expand=True)
    elif ui_state == "RESULT":
        k = ROOM_NAMES.get(killed_room, "-") if killed_room else "-"
        last_bet = bet_history[-1] if bet_history else None
        result_text = "⏳ WAITING"
        result_color = TBTOOL_COLORS["gold"]
        border = TBTOOL_COLORS["gold"]
        if last_bet and last_bet.get('issue') == issue_id:
            if last_bet.get('result') == "Thắng":
                result_text = f"🎉 {ICONS['trophy']} WINNER {ICONS['trophy']}"
                result_color = TBTOOL_COLORS["emerald"]
                border = TBTOOL_COLORS["emerald"]
            elif last_bet.get('result') == "Thua":
                result_text = f"💀 {ICONS['fire']} LOSER {ICONS['fire']}"
                result_color = TBTOOL_COLORS["ruby"]
                border = TBTOOL_COLORS["ruby"]
        content = Text.assemble(("\n", ""), ("╔═══════════════════════════════════╗\n", border), ("║  ", border), (f"{result_text:^31}", f"bold {result_color}"), ("  ║\n", border), ("╚═══════════════════════════════════╝\n", border), ("\n", ""), ("☠️ Killer: ", ""), (f"{k}", f"bold {TBTOOL_COLORS['ruby']}"), ("\n", ""), ("📊 P&L: ", ""), (f"{cumulative_profit:+,.2f}", f"bold {TBTOOL_COLORS['gold']}"), (" BUILD", ""))
        return Panel(Align.center(content), border_style=border, box=box.HEAVY, padding=1, expand=True)
    else:
        return Panel(Align.center(Text(f"⏳ {ICONS['sparkle']} Waiting for game data... {ICONS['sparkle']}", style=TBTOOL_COLORS["gold"])), border_style=TBTOOL_COLORS["gold"], box=box.HEAVY, expand=True)

def build_premium_history():
    t = Table(title=f"[bold {TBTOOL_COLORS['gold']}]📜 BET HISTORY[/bold {TBTOOL_COLORS['gold']}]", box=box.ROUNDED, expand=True, border_style=TBTOOL_COLORS["onyx"])
    t.add_column("Round", no_wrap=True, style=TBTOOL_COLORS["sapphire"])
    t.add_column("Room", no_wrap=True, style=TBTOOL_COLORS["neon_blue"])
    t.add_column("Amount", justify="right", no_wrap=True, style=TBTOOL_COLORS["gold"])
    t.add_column("Result", no_wrap=True)
    t.add_column("AI", no_wrap=True, style=TBTOOL_COLORS["neon_pink"])
    last_n = list(bet_history)[-6:]
    for b in reversed(last_n):
        amt = b.get('amount') or 0
        res = str(b.get('result') or '⏳')
        algo = str(b.get('algo') or '-')
        if "Thắng" in res:
            res_text = Text(f"✅ {ICONS['trophy']}", style=TBTOOL_COLORS["emerald"])
        elif "Thua" in res:
            res_text = Text(f"❌ {ICONS['fire']}", style=TBTOOL_COLORS["ruby"])
        else:
            res_text = Text(f"⏳ {ICONS['sparkle']}", style=TBTOOL_COLORS["gold"])
        t.add_row(str(b.get('issue') or '-'), ROOM_NAMES.get(b.get('room'), str(b.get('room') or '-')), f"{float(amt):,.2f}", res_text, algo[:1] if algo else '-')
    return Panel(t, border_style=TBTOOL_COLORS["sapphire"], box=box.HEAVY, expand=True)

def build_premium_marquee():
    messages = [
        f"⚡ {ICONS['lightning']} TBTOOL VIP PREMIUM - Best AI Tool {ICONS['crown']}",
        f"🧠 {ICONS['brain']} AI Powered Prediction System v2.0 {ICONS['robot']}",
        f"💰 {ICONS['diamond']} Play Smart, Win Big with TBTOOL {ICONS['trophy']}",
        f"🔥 {ICONS['fire']} Don't Gamble - Let AI Decide {ICONS['shield']}",
        f"🎯 {ICONS['target']} 99.9% Accuracy with Advanced Neural Network {ICONS['sparkle']}",
        f"👑 {ICONS['crown']} Premium Features: Auto Martingale, Stop Loss, Take Profit",
        f"🤖 {ICONS['robot']} 10 AI Strategies: Choose the Best for You",
        f"💎 {ICONS['gem']} VIP Support: @tbtool88 - 24/7 Assistance",
    ]
    message = messages[int(time.time() / 8) % len(messages)]
    full_text = " " * 30 + message + " " * 30
    width = console.width or 80
    start_index = int(time.time() * 3) % len(full_text)
    display_text = (full_text * 3)[start_index : start_index + width]
    return Panel(Text(display_text, style=f"bold {TBTOOL_COLORS['neon_blue']}", no_wrap=True), box=box.ROUNDED, border_style=TBTOOL_COLORS["onyx"], padding=0, expand=True)

def save_strategy_config():
    config_data = {"base_bet": base_bet, "multiplier": multiplier, "algo": settings.get("algo"), "bet_rounds_before_skip": bet_rounds_before_skip, "pause_after_losses": pause_after_losses, "profit_target": profit_target, "stop_when_profit_reached": stop_when_profit_reached, "stop_loss_target": stop_loss_target, "stop_when_loss_reached": stop_when_loss_reached}
    try:
        with open(STRATEGY_CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(config_data, f, indent=2)
        console.print(f"[green]✅ Config saved to '{STRATEGY_CONFIG_FILE}'[/green]")
    except Exception as e:
        console.print(f"[red]❌ Error saving config: {e}[/red]")

def load_strategy_config() -> bool:
    global base_bet, multiplier, run_mode, bet_rounds_before_skip, current_bet, pause_after_losses, profit_target, stop_when_profit_reached, stop_loss_target, stop_when_loss_reached
    if not Path(STRATEGY_CONFIG_FILE).exists():
        console.print(f"[yellow]⚠️ Config file '{STRATEGY_CONFIG_FILE}' not found.[/yellow]")
        console.print("[yellow]➜ Please use option [4] to save config first.[/yellow]")
        return False
    try:
        with open(STRATEGY_CONFIG_FILE, "r", encoding="utf-8") as f:
            config_data = json.load(f)
        base_bet = config_data.get("base_bet", 1.0)
        multiplier = config_data.get("multiplier", 2.0)
        settings["algo"] = config_data.get("algo", "SAFE")
        bet_rounds_before_skip = config_data.get("bet_rounds_before_skip", 0)
        pause_after_losses = config_data.get("pause_after_losses", 0)
        profit_target = config_data.get("profit_target", None)
        stop_when_profit_reached = config_data.get("stop_when_profit_reached", False)
        stop_loss_target = config_data.get("stop_loss_target", None)
        stop_when_loss_reached = config_data.get("stop_when_loss_reached", False)
        current_bet = base_bet
        run_mode = "AUTO"
        console.print(f"[green]✅ Config loaded from '{STRATEGY_CONFIG_FILE}'[/green]")
        console.print()
        summary = build_config_summary()
        console.print(Panel(summary, title="[bold]LOADED CONFIG[/bold]", box=box.HEAVY, border_style=TBTOOL_COLORS["emerald"], expand=False))
        time.sleep(2)
        return True
    except Exception as e:
        console.print(f"[red]❌ Error loading config: {e}[/red]")
        return False

def build_config_summary():
    summary = Table(box=box.ROUNDED, show_header=False, border_style=TBTOOL_COLORS["gold"])
    summary.add_column(style=f"bold {TBTOOL_COLORS['sapphire']}", width=20)
    summary.add_column(style="white")
    config_items = [
        (f"{ICONS['money']} Cược gốc:", f"[bold {TBTOOL_COLORS['emerald']}]{base_bet:,.2f} BUILD[/bold {TBTOOL_COLORS['emerald']}]"),
        (f"{ICONS['chart']} Hệ số nhân:", f"[bold {TBTOOL_COLORS['gold']}]x{multiplier}[/bold {TBTOOL_COLORS['gold']}]"),
        (f"{ICONS['brain']} Thuật toán:", f"[bold {TBTOOL_COLORS['neon_pink']}]{SELECTION_MODES.get(settings['algo'], settings['algo'])}[/bold {TBTOOL_COLORS['neon_pink']}]"),
        (f"{ICONS['shield']} Chống soi:", f"[bold {TBTOOL_COLORS['sapphire']}]Nghỉ 1 ván sau {bet_rounds_before_skip} ván[/bold {TBTOOL_COLORS['sapphire']}]" if bet_rounds_before_skip > 0 else "[dim]Không kích hoạt[/dim]"),
        (f"{ICONS['clock']} Nghỉ khi thua:", f"[bold {TBTOOL_COLORS['sapphire']}]Nghỉ {pause_after_losses} ván[/bold {TBTOOL_COLORS['sapphire']}]" if pause_after_losses > 0 else "[dim]Không kích hoạt[/dim]"),
        (f"{ICONS['target']} Mục tiêu lãi:", f"[bold {TBTOOL_COLORS['emerald']}]Dừng khi đạt {profit_target:,.2f} BUILD[/bold {TBTOOL_COLORS['emerald']}]" if profit_target else "[dim]Chạy vô hạn[/dim]"),
        (f"{ICONS['shield']} Cắt lỗ:", f"[bold {TBTOOL_COLORS['ruby']}]Dừng khi còn {stop_loss_target:,.2f} BUILD[/bold {TBTOOL_COLORS['ruby']}]" if stop_loss_target else "[dim]Không kích hoạt[/dim]"),
    ]
    for label, value in config_items:
        summary.add_row(label, value)
    return summary

def build_config_header():
    return Panel(Align.center(Text.assemble((f"{ICONS['settings']} ", f"bold {TBTOOL_COLORS['gold']}"), ("PREMIUM CONFIGURATION", f"bold {TBTOOL_COLORS['neon_blue']}"), (f" {ICONS['settings']}", f"bold {TBTOOL_COLORS['gold']}"))), border_style=TBTOOL_COLORS["gold"], box=box.DOUBLE)

def build_step_indicator(current_step: int, total_steps: int):
    steps = ["💰 VỐN", "🧠 AI", "🛡️ RỦI RO", "🎯 MỤC TIÊU"]
    step_indicators = []
    for i, step in enumerate(steps, 1):
        if i < current_step:
            step_indicators.append(f"[bold {TBTOOL_COLORS['emerald']}]✅ {step}[/bold {TBTOOL_COLORS['emerald']}]")
        elif i == current_step:
            step_indicators.append(f"[bold {TBTOOL_COLORS['gold']}]▶️ {step}[/bold {TBTOOL_COLORS['gold']}]")
        else:
            step_indicators.append(f"[dim]◻️ {step}[/dim]")
    return "  →  ".join(step_indicators)

def prompt_settings() -> bool:
    global base_bet, multiplier, run_mode, bet_rounds_before_skip, current_bet, pause_after_losses, profit_target, stop_when_profit_reached, stop_loss_target, stop_when_loss_reached
    
    console.clear()
    console.print(build_config_header())
    console.print()
    
    console.print(build_step_indicator(1, 4))
    console.print(Rule(f"[bold {TBTOOL_COLORS['gold']}]💎 BƯỚC 1: QUẢN LÝ VỐN[/bold {TBTOOL_COLORS['gold']}]", style=TBTOOL_COLORS["gold"]))
    
    info_panel = Panel(Text.assemble((f"{ICONS['info']} ", "bold yellow"), ("Hãy thiết lập số vốn và mức cược phù hợp với túi tiền của bạn", "white"), ("\n", ""), (f"{ICONS['warning']} ", "bold red"), ("Không nên đặt quá 5-10% tổng vốn mỗi ván", "yellow")), border_style=TBTOOL_COLORS["sapphire"], box=box.ROUNDED)
    console.print(info_panel)
    console.print()
    console.print(f"[bold {TBTOOL_COLORS['neon_blue']}]💰 Cược gốc:[/bold {TBTOOL_COLORS['neon_blue']}]")
    console.print("[dim]➜ Số BUILD sẽ đặt mỗi ván (tối thiểu 1.0)[/dim]")
    base_bet = FloatPrompt.ask("   >>", default=1.0)
    console.print(f"\n[bold {TBTOOL_COLORS['neon_blue']}]📈 Hệ số nhân (Gấp thếp):[/bold {TBTOOL_COLORS['neon_blue']}]")
    console.print("[dim]➜ Số lần nhân khi thua (khuyến nghị 2.0 - 10.0)[/dim]")
    multiplier = FloatPrompt.ask("   >>", default=2.0)
    current_bet = base_bet
    
    console.clear()
    console.print(build_config_header())
    console.print()
    
    console.print(build_step_indicator(2, 4))
    console.print(Rule(f"[bold {TBTOOL_COLORS['neon_pink']}]🧠 BƯỚC 2: CHỌN THUẬT TOÁN AI[/bold {TBTOOL_COLORS['neon_pink']}]", style=TBTOOL_COLORS["neon_pink"]))
    
    modes = list(SELECTION_MODES.items())
    algo_table = Table(box=box.ROUNDED, border_style=TBTOOL_COLORS["neon_pink"])
    algo_table.add_column("STT", style=f"bold {TBTOOL_COLORS['gold']}", width=4)
    algo_table.add_column("Tên thuật toán", style=TBTOOL_COLORS["neon_blue"])
    algo_table.add_column("Mô tả", style="dim")
    
    is_vip = is_vip_activated()
    is_admin = is_admin_activated()
    
    algo_descriptions = {
        "RANDOM": "Ngẫu nhiên, không suy nghĩ",
        "MIN_PLAYER_BET": "Chọn phòng ít người & ít tiền nhất",
        "PROBABILITY": "Dựa trên xác suất thống kê",
        "FOLLOW_KILLER": "Theo dấu sát thủ vừa xuất hiện",
        "SEQUENTIAL": "Đặt theo thứ tự 1→2→3→...→8",
        "KILLER_PERSONALITY": "Học thói quen của sát thủ",
        "SMART_SAFE": "Tính toán an toàn thông minh",
        "FOLLOW_KILLER_DELAYED": "Theo vết sát thủ (delay 1 ván)",
        "HIDE_SEEK_MASTER": "Thuật toán trốn tìm cao cấp",
        "VIP_RANDOM": "Random 1 trong 9 logic mỗi ván (VIP)",
        "KILLER_WAVE": "Bắt sóng sát thủ theo chu kỳ (VIP)",
        "PSYCHO_ANALYSIS": "Phân tích tâm lý đám đông (VIP)",
        "MARKOV_CHAIN": "Dùng xác suất Markov (VIP)",
        "GOD_MODE": "THẦN THÁNH - Tỷ lệ thắng cao nhất (ADMIN)",
    }
    
    for i, (key, label) in enumerate(modes, 1):
        desc = algo_descriptions.get(key, "")
        if key in ["VIP_RANDOM", "KILLER_WAVE", "PSYCHO_ANALYSIS", "MARKOV_CHAIN"] and not is_vip and not is_admin:
            desc += " 🔒 (Chỉ VIP)"
        if key == "GOD_MODE" and not is_admin:
            desc += " 🔒 (Chỉ ADMIN)"
        algo_table.add_row(str(i), label, desc)
    
    console.print(algo_table)
    console.print()
    
    # Cho phép chọn logic, không tự động
    if is_admin:
        console.print("[bold red]👑 ADMIN: Có thể chọn bất kỳ logic nào![/bold red]")
    elif is_vip:
        console.print("[bold gold]👑 VIP: Có thể chọn logic VIP (10-13)[/bold gold]")
    else:
        console.print("[dim]🔓 FREE: Chỉ được chọn logic 1-9[/dim]")
    
    choice = IntPrompt.ask(
        f"[bold {TBTOOL_COLORS['gold']}]>> Chọn số thứ tự[/bold {TBTOOL_COLORS['gold']}]",
        choices=[str(i) for i in range(1, len(modes) + 1)],
        default=1
    )
    selected_key = modes[choice - 1][0]
    
    # Kiểm tra quyền
    if selected_key in ["VIP_RANDOM", "KILLER_WAVE", "PSYCHO_ANALYSIS", "MARKOV_CHAIN"]:
        if not is_vip and not is_admin:
            console.print("[red]❌ Logic VIP chỉ dành cho Key VIP! Chuyển sang RANDOM.[/red]")
            settings["algo"] = "RANDOM"
        else:
            settings["algo"] = selected_key
    elif selected_key == "GOD_MODE":
        if not is_admin:
            console.print("[red]❌ LOGIC THẦN THÁNH chỉ dành cho ADMIN! Chuyển sang RANDOM.[/red]")
            settings["algo"] = "RANDOM"
        else:
            settings["algo"] = selected_key
    else:
        settings["algo"] = selected_key
    
    console.print(f"[green]✅ Đã chọn: {SELECTION_MODES.get(settings['algo'])}[/green]")
    
    console.clear()
    console.print(build_config_header())
    console.print()
    
    console.print(build_step_indicator(3, 4))
    console.print(Rule(f"[bold {TBTOOL_COLORS['sapphire']}]🛡️ BƯỚC 3: QUẢN LÝ RỦI RO[/bold {TBTOOL_COLORS['sapphire']}]", style=TBTOOL_COLORS["sapphire"]))
    
    risk_panel = Panel(Text.assemble((f"{ICONS['shield']} ", "bold cyan"), ("Các tính năng bảo vệ giúp giảm thiểu rủi ro khi chơi", "white"), ("\n", ""), (f"{ICONS['info']} ", "dim"), ("Nhập 0 để bỏ qua tính năng", "dim")), border_style=TBTOOL_COLORS["sapphire"], box=box.ROUNDED)
    console.print(risk_panel)
    console.print()
    console.print(f"[bold {TBTOOL_COLORS['neon_blue']}]🛡️ Chống soi:[/bold {TBTOOL_COLORS['neon_blue']}]")
    console.print("[dim]➜ Nghỉ 1 ván sau mỗi N ván đặt (tránh bị phát hiện)[/dim]")
    bet_rounds_before_skip = IntPrompt.ask("   >> Nhập số ván", default=0)
    console.print(f"\n[bold {TBTOOL_COLORS['neon_blue']}]⏸️ Nghỉ khi thua liên tiếp:[/bold {TBTOOL_COLORS['neon_blue']}]")
    console.print("[dim]➜ Nghỉ N ván sau khi thua (giảm cảm xúc)[/dim]")
    pause_after_losses = IntPrompt.ask("   >> Nhập số ván nghỉ", default=0)
    
    console.clear()
    console.print(build_config_header())
    console.print()
    
    console.print(build_step_indicator(4, 4))
    console.print(Rule(f"[bold {TBTOOL_COLORS['gold']}]🎯 BƯỚC 4: ĐẶT MỤC TIÊU[/bold {TBTOOL_COLORS['gold']}]", style=TBTOOL_COLORS["gold"]))
    
    target_panel = Panel(Text.assemble((f"{ICONS['target']} ", "bold yellow"), ("Đặt mục tiêu lãi và cắt lỗ để bảo vệ tài khoản", "white"), ("\n", ""), (f"{ICONS['info']} ", "dim"), ("Để trống để chạy vô hạn", "dim")), border_style=TBTOOL_COLORS["gold"], box=box.ROUNDED)
    console.print(target_panel)
    console.print()
    console.print(f"[bold {TBTOOL_COLORS['emerald']}]🎯 Mục tiêu lãi:[/bold {TBTOOL_COLORS['emerald']}]")
    console.print("[dim]➜ Dừng tool khi đạt số BUILD này (nhập số dư mong muốn)[/dim]")
    pt_str = Prompt.ask("   >> Nhập số BUILD (Enter để bỏ qua)", default="")
    if pt_str.strip():
        try:
            profit_target = float(pt_str)
            stop_when_profit_reached = True
            console.print(f"[green]✅ Đã đặt mục tiêu lãi: {profit_target:,.2f} BUILD[/green]")
        except ValueError:
            profit_target = None
            stop_when_profit_reached = False
            console.print("[dim]⏭️ Bỏ qua mục tiêu lãi[/dim]")
    else:
        profit_target = None
        stop_when_profit_reached = False
        console.print("[dim]⏭️ Bỏ qua mục tiêu lãi[/dim]")
    console.print()
    console.print(f"[bold {TBTOOL_COLORS['ruby']}]💀 Cắt lỗ:[/bold {TBTOOL_COLORS['ruby']}]")
    console.print("[dim]➜ Dừng tool khi số dư còn lại là N BUILD[/dim]")
    sl_str = Prompt.ask("   >> Nhập số BUILD tối thiểu (Enter để bỏ qua)", default="")
    if sl_str.strip():
        try:
            stop_loss_target = float(sl_str)
            stop_when_loss_reached = True
            console.print(f"[green]✅ Đã đặt cắt lỗ: còn {stop_loss_target:,.2f} BUILD[/green]")
        except ValueError:
            stop_loss_target = None
            stop_when_loss_reached = False
            console.print("[dim]⏭️ Bỏ qua cắt lỗ[/dim]")
    else:
        stop_loss_target = None
        stop_when_loss_reached = False
        console.print("[dim]⏭️ Bỏ qua cắt lỗ[/dim]")
    console.print()
    console.print(Rule(f"[bold {TBTOOL_COLORS['gold']}]📋 TỔNG KẾT CẤU HÌNH[/bold {TBTOOL_COLORS['gold']}]", style=TBTOOL_COLORS["gold"]))
    console.print(build_config_summary())
    console.print()
    console.print(Panel(Align.center(Text.assemble((f"{ICONS['check']} ", "bold green"), ("Cấu hình đã hoàn tất! ", "bold white"), (f"{ICONS['sparkle']}", "bold gold"))), border_style=TBTOOL_COLORS["emerald"], box=box.ROUNDED))
    start_choice = Prompt.ask(f"\n[bold {TBTOOL_COLORS['gold']}]>> Bắt đầu chơi ngay? (Enter để bắt đầu / q để thoát)[/bold {TBTOOL_COLORS['gold']}]", default="")
    if start_choice.lower() == 'q':
        return False
    console.clear()
    run_mode = "AUTO"
    return True

def load_accounts() -> list:
    acc_file = Path("accounts.json")
    if not acc_file.exists():
        return []
    try:
        return json.loads(acc_file.read_text())
    except (json.JSONDecodeError, IOError):
        return []

def save_accounts(accounts: list):
    acc_file = Path("accounts.json")
    with acc_file.open("w", encoding="utf-8") as f:
        json.dump(accounts, f, indent=2)

def add_new_account(accounts: list) -> bool:
    console.clear()
    header = Panel(Align.center(Text.assemble((f"{ICONS['user']} ", f"bold {TBTOOL_COLORS['gold']}"), ("ADD NEW ACCOUNT", f"bold {TBTOOL_COLORS['neon_blue']}"), (f" {ICONS['user']}", f"bold {TBTOOL_COLORS['gold']}"))), border_style=TBTOOL_COLORS["gold"], box=box.DOUBLE)
    console.print(header)
    console.print()
    console.print(Panel(Text.assemble((f"{ICONS['info']} ", "bold yellow"), ("Dán link trò chơi vào bên dưới", "white"), ("\n", ""), ("Ví dụ: ", "dim"), ("https://xworld.info/?userId=12345&secretKey=abc123", "dim cyan")), border_style=TBTOOL_COLORS["sapphire"], box=box.ROUNDED))
    console.print()
    link = Prompt.ask(f"[bold {TBTOOL_COLORS['gold']}]>> Paste link[/bold {TBTOOL_COLORS['gold']}]")
    if not link:
        console.print("[yellow]Cancelled.[/yellow]")
        time.sleep(1)
        return False
    try:
        parsed = urlparse(link)
        params = parse_qs(parsed.query)
        if 'userId' in params and 'secretKey' in params:
            uid = int(params.get('userId')[0])
            skey = params.get('secretKey', [None])[0]
            if any(acc.get('userId') == uid for acc in accounts):
                console.print(f"[yellow]⚠️ Account userId: {uid} already exists.[/yellow]")
                time.sleep(2)
                return False
            accounts.append({"userId": uid, "secretKey": skey})
            save_accounts(accounts)
            console.print(Panel(Align.center(Text.assemble((f"{ICONS['check']} ", "bold green"), (f"Added account: ", "bold white"), (f"{uid}", f"bold {TBTOOL_COLORS['gold']}"))), border_style=TBTOOL_COLORS["emerald"], box=box.ROUNDED))
            time.sleep(2)
            return True
        else:
            console.print("[red]❌ Invalid link! Missing 'userId' or 'secretKey'.[/red]")
            time.sleep(2)
            return False
    except Exception as e:
        console.print(f"[red]❌ Error: {e}[/red]")
        time.sleep(2)
        return False

def delete_account(accounts: list) -> bool:
    console.clear()
    header = Panel(Align.center(Text.assemble((f"{ICONS['fire']} ", f"bold {TBTOOL_COLORS['ruby']}"), ("DELETE ACCOUNT", f"bold {TBTOOL_COLORS['neon_blue']}"), (f" {ICONS['fire']}", f"bold {TBTOOL_COLORS['ruby']}"))), border_style=TBTOOL_COLORS["ruby"], box=box.DOUBLE)
    console.print(header)
    console.print()
    if not accounts:
        console.print("[yellow]No accounts to delete.[/yellow]")
        time.sleep(2)
        return False
    table = Table(box=box.ROUNDED, border_style=TBTOOL_COLORS["ruby"])
    table.add_column("STT", style=f"bold {TBTOOL_COLORS['gold']}", width=6)
    table.add_column("User ID", style=TBTOOL_COLORS["neon_blue"])
    for i, acc in enumerate(accounts, 1):
        table.add_row(str(i), str(acc.get('userId')))
    console.print(table)
    console.print()
    choice_str = Prompt.ask(f"[bold {TBTOOL_COLORS['ruby']}]>> Select account to delete[/bold {TBTOOL_COLORS['ruby']}]", default="")
    if not choice_str:
        console.print("[yellow]Cancelled.[/yellow]")
        time.sleep(1)
        return False
    try:
        choice_idx = int(choice_str) - 1
        if 0 <= choice_idx < len(accounts):
            removed_acc = accounts.pop(choice_idx)
            save_accounts(accounts)
            console.print(f"[green]✅ Deleted account: {removed_acc.get('userId')}[/green]")
            time.sleep(2)
            return True
        else:
            console.print("[red]❌ Invalid selection.[/red]")
            time.sleep(1)
            return False
    except ValueError:
        console.print("[red]❌ Invalid input.[/red]")
        time.sleep(1)
        return False

def select_account_premium() -> bool:
    global USER_ID, SECRET_KEY
    while True:
        console.clear()
        header = Panel(Align.center(Text.assemble((f"{ICONS['user']} ", f"bold {TBTOOL_COLORS['gold']}"), ("SELECT ACCOUNT", f"bold {TBTOOL_COLORS['neon_blue']}"), (f" {ICONS['user']}", f"bold {TBTOOL_COLORS['gold']}"))), border_style=TBTOOL_COLORS["gold"], box=box.DOUBLE)
        console.print(header)
        console.print()
        accounts = load_accounts()
        if not accounts:
            console.print(Panel(Align.center(Text.assemble((f"{ICONS['warning']} ", "bold yellow"), ("Không có tài khoản nào!", "bold white"), ("\n", ""), ("Vui lòng dùng tùy chọn [2] để thêm tài khoản", "dim"))), border_style=TBTOOL_COLORS["ruby"], box=box.ROUNDED))
            time.sleep(2)
            return False
        table = Table(title=f"[bold {TBTOOL_COLORS['gold']}]📋 ACCOUNT LIST[/bold {TBTOOL_COLORS['gold']}]", box=box.HEAVY, border_style=TBTOOL_COLORS["sapphire"])
        table.add_column("STT", style=f"bold {TBTOOL_COLORS['gold']}", width=6)
        table.add_column("User ID", style=TBTOOL_COLORS["neon_blue"])
        table.add_column("Balance", justify="right")
        table.add_column("Status", justify="center")
        with console.status(f"[bold {TBTOOL_COLORS['neon_blue']}]🔍 Checking balances...[/bold {TBTOOL_COLORS['neon_blue']}]", spinner="dots") as status:
            for i, acc in enumerate(accounts, 1):
                uid = acc.get('userId')
                skey = acc.get('secretKey')
                status.update(f"[{TBTOOL_COLORS['neon_blue']}]Checking account {uid}...[/{TBTOOL_COLORS['neon_blue']}]")
                build, _, _ = fetch_balances_3games(uid=uid, secret=skey)
                if build is not None:
                    balance_str = f"[bold {TBTOOL_COLORS['emerald']}]{build:,.4f}[/bold {TBTOOL_COLORS['emerald']}]"
                    status_str = f"[{TBTOOL_COLORS['emerald']}]✅ Online[/{TBTOOL_COLORS['emerald']}]"
                else:
                    balance_str = f"[{TBTOOL_COLORS['ruby']}]❌ Error[/{TBTOOL_COLORS['ruby']}]"
                    status_str = f"[{TBTOOL_COLORS['ruby']}]❌ Offline[/{TBTOOL_COLORS['ruby']}]"
                table.add_row(str(i), str(uid), balance_str, status_str)
        console.print(table)
        console.print()
        choices = [str(i) for i in range(1, len(accounts) + 1)]
        choice_str = Prompt.ask(f"[bold {TBTOOL_COLORS['gold']}]>> Select account number[/bold {TBTOOL_COLORS['gold']}]", choices=choices, default="")
        if not choice_str:
            return False
        try:
            choice_idx = int(choice_str) - 1
            if 0 <= choice_idx < len(accounts):
                selected_account = accounts[choice_idx]
                USER_ID = selected_account['userId']
                SECRET_KEY = selected_account['secretKey']
                console.print(Panel(Align.center(Text.assemble((f"{ICONS['check']} ", "bold green"), (f"Đã chọn tài khoản: ", "bold white"), (f"{USER_ID}", f"bold {TBTOOL_COLORS['gold']}"))), border_style=TBTOOL_COLORS["emerald"], box=box.ROUNDED))
                time.sleep(1.5)
                return True
            else:
                console.print("[red]❌ Invalid selection![/red]")
                time.sleep(1)
                return False
        except ValueError:
            console.print("[red]❌ Invalid input![/red]")
            time.sleep(1)
            return False

def start_threads():
    threading.Thread(target=start_ws, daemon=True).start()
    threading.Thread(target=monitor_loop, daemon=True).start()

def start_game_flow():
    global stop_flag, IS_VIP_USER, IS_ADMIN_USER
    if USER_ID is None or SECRET_KEY is None:
        console.print("[red]❌ No account selected.[/red]")
        time.sleep(2)
        return
    _, _, IS_VIP_USER = check_activation_valid()
    IS_ADMIN_USER = is_admin_activated()
    if IS_ADMIN_USER:
        console.print(f"[bold red]👑 ADMIN MODE ACTIVATED - Logic Thần Thánh[/bold red]")
    elif IS_VIP_USER:
        console.print(f"[bold gold]👑 VIP MODE ACTIVATED - Logic VIP[/bold gold]")
    else:
        console.print("[dim]🔓 FREE MODE - Chỉ dùng 9 logic cơ bản[/dim]")
    console.print(Rule("[bold green]🚀 SYSTEM STARTING...[/]", style="green"))
    start_threads()
    with console.status("[bold green]Connecting to game server...[/]", spinner="dots") as status:
        initial_wait_start = time.time()
        while issue_id is None and (time.time() - initial_wait_start) < 30:
            time.sleep(0.5)
        if issue_id is None:
            console.print("\n[bold red]❌ No game data received after 30 seconds.[/]")
            console.print("[yellow]Please check network connection.[/yellow]")
            time.sleep(3)
            return
    poller = BalancePoller(USER_ID, SECRET_KEY, poll_seconds=max(1, int(BALANCE_POLL_INTERVAL)), on_balance=None, on_error=None, on_status=None)
    poller.start()
    console.print("\n[bold green]✅ Connected successfully! Starting interface...[/bold green]")
    time.sleep(2)
    def generate_layout() -> Table:
        is_mobile = console.width < 100
        if is_mobile:
            main_layout = Table.grid(expand=True, pad_edge=False)
            main_layout.add_row(build_premium_rooms())
            main_layout.add_row(build_premium_mid())
            main_layout.add_row(build_premium_history())
        else:
            main_grid = Table.grid(expand=True, pad_edge=False)
            main_grid.add_column("main", ratio=60)
            main_grid.add_column("side", ratio=40)
            right_column_grid = Table.grid(expand=True, pad_edge=False)
            right_column_grid.add_row(build_premium_mid())
            right_column_grid.add_row(build_premium_history())
            main_grid.add_row(build_premium_rooms(), right_column_grid)
            main_layout = main_grid
        root_layout = Table.grid(expand=True, pad_edge=False)
        root_layout.add_row(build_premium_header())
        root_layout.add_row(build_premium_marquee())
        root_layout.add_row(main_layout)
        return root_layout
    with Live(generate_layout(), refresh_per_second=4, console=console, screen=True) as live:
        try:
            while not stop_flag:
                live.update(generate_layout())
                time.sleep(0.25)
            console.print("[bold yellow]Tool stopped.[/]")
        except KeyboardInterrupt:
            console.print("[yellow]User exit.[/]")
            poller.stop()

def build_main_menu():
    console.clear()
    logo_text = build_logo_with_gradient(LOGO_PREMIUM)
    console.print(Align.center(logo_text))
    status_bar = Table.grid(padding=(0, 2), expand=True)
    status_bar.add_column(justify="center")
    is_valid, msg, is_vip = check_activation_valid()
    is_admin = is_admin_activated()
    if is_admin:
        status = f"[bold {TBTOOL_COLORS['ruby']}]👑 ADMIN - {msg}[/bold {TBTOOL_COLORS['ruby']}]"
    elif is_valid:
        status = f"[bold {TBTOOL_COLORS['emerald']}]✅ ACTIVE - {msg}[/bold {TBTOOL_COLORS['emerald']}]"
        if is_vip:
            status += f" [bold gold]👑 VIP[/bold gold]"
    else:
        status = f"[bold {TBTOOL_COLORS['ruby']}]❌ NOT ACTIVATED[/bold {TBTOOL_COLORS['ruby']}]"
    status_bar.add_row(status)
    console.print(Panel(status_bar, border_style=TBTOOL_COLORS["onyx"], box=box.ROUNDED))
    console.print()
    menu_panel = Panel(Align.center(Text.assemble(
        ("\n", ""),
        (f"  {ICONS['crown']}  ", f"bold {TBTOOL_COLORS['gold']}"),
        ("TBTOOL VIP PREMIUM", f"bold {TBTOOL_COLORS['neon_blue']}"),
        (f"  {ICONS['crown']}  ", f"bold {TBTOOL_COLORS['gold']}"),
        ("\n", ""),
        ("╔════════════════════════════════════════════════════════════╗\n", f"dim {TBTOOL_COLORS['gold']}"),
        ("║  [1]  🎯  PLAY & CONFIG                                   ║\n", f"bold {TBTOOL_COLORS['neon_green']}"),
        ("║       ➜ Chọn tài khoản và thiết lập chiến lược chơi      ║\n", "dim"),
        ("║                                                          ║\n", "dim"),
        ("║  [2]  ➕  ADD ACCOUNT                                    ║\n", f"bold {TBTOOL_COLORS['sapphire']}"),
        ("║       ➜ Thêm tài khoản mới vào danh sách                 ║\n", "dim"),
        ("║                                                          ║\n", "dim"),
        ("║  [3]  🗑️  DELETE ACCOUNT                                 ║\n", f"bold {TBTOOL_COLORS['ruby']}"),
        ("║       ➜ Xóa tài khoản khỏi danh sách                     ║\n", "dim"),
        ("║                                                          ║\n", "dim"),
        ("║  [4]  ⚙️  SAVE CONFIG                                    ║\n", f"bold {TBTOOL_COLORS['gold']}"),
        ("║       ➜ Lưu cấu hình hiện tại để dùng sau                ║\n", "dim"),
        ("║                                                          ║\n", "dim"),
        ("║  [5]  🚀  PLAY WITH CONFIG                               ║\n", f"bold {TBTOOL_COLORS['neon_pink']}"),
        ("║       ➜ Chơi ngay với cấu hình đã lưu                    ║\n", "dim"),
        ("║                                                          ║\n", "dim"),
        ("║  [q]  👋  EXIT                                           ║\n", f"bold {TBTOOL_COLORS['rose']}"),
        ("║       ➜ Thoát chương trình                               ║\n", "dim"),
        ("╚════════════════════════════════════════════════════════════╝\n", f"dim {TBTOOL_COLORS['gold']}"),
        ("\n", ""),
        (f"  💬  Support: @tbtool88  |  Version: 2.0 Premium\n", f"bold {TBTOOL_COLORS['neon_blue']}"),
        ("\n", ""),
    )), border_style=TBTOOL_COLORS["gold"], box=box.DOUBLE, padding=(1, 2))
    console.print(menu_panel)
    console.print()
    choice = Prompt.ask(f"[bold {TBTOOL_COLORS['gold']}]>> Enter your choice[/bold {TBTOOL_COLORS['gold']}]", choices=['1','2','3','4','5','q'], default='q').lower()
    return choice

def main_vth():
    if not check_activation_valid()[0]:
        console.print("[red]❌ Invalid license. Exiting.[/red]")
        time.sleep(2)
        return
    console.clear()
    welcome = Panel(Align.center(Text.assemble((f"{ICONS['crown']} ", f"bold {TBTOOL_COLORS['gold']}"), ("WELCOME TO ", "bold white"), ("TBTOOL VIP PREMIUM", f"bold {TBTOOL_COLORS['neon_blue']}"), (f" {ICONS['crown']}", f"bold {TBTOOL_COLORS['gold']}"))), border_style=TBTOOL_COLORS["gold"], box=box.DOUBLE)
    console.print(welcome)
    console.print(f"[dim]💬 Support: @tbtool88 | Version 2.0 Premium[/dim]")
    time.sleep(1)
    while True:
        global stop_flag
        stop_flag = False
        choice = build_main_menu()
        if choice == '1':
            console.clear()
            if select_account_premium():
                if prompt_settings():
                    start_game_flow()
        elif choice == '2':
            accounts = load_accounts()
            add_new_account(accounts)
        elif choice == '3':
            accounts = load_accounts()
            delete_account(accounts)
        elif choice == '4':
            console.clear()
            if prompt_settings():
                save_strategy_config()
            time.sleep(2)
        elif choice == '5':
            console.clear()
            if select_account_premium():
                if load_strategy_config():
                    start_game_flow()
                else:
                    time.sleep(2)
        elif choice == 'q':
            console.print(Panel(Align.center(Text.assemble((f"{ICONS['crown']} ", "bold gold"), ("THANK YOU FOR USING TBTOOL VIP PREMIUM!", "bold white"), (f" {ICONS['crown']}", "bold gold"))), border_style=TBTOOL_COLORS["gold"], box=box.DOUBLE))
            break

# ================== TOOL 2: LOTTO ==================

ACCOUNTS_FILE = "accounts.json"
CONFIG_FILE = "wh_config.json"
API_URL = "https://api.winhash.net/lucky_game/hourly_issue_list"
HOME_URL = "https://api.winhash.net/lucky_game/home"
API_URL_GET_BALANCE = "https://wallet.3games.io/api/wallet/user_asset"
HOME_POLL_INTERVAL = 3
UI_REFRESH = 6
DECIMALS = 4
CONF_BET_THRESHOLD = 0.60
MIN_SAMPLE_FOR_BET = 4

BET_ITEM_IDS = {"small": 70309, "big": 71218, "draw": 71011}
ICON_LOTTO = {"small": "🔵", "big": "🔴", "draw": "⚖️", 1:"①", 2:"②", 3:"③", 4:"④", 5:"⑤", 6:"⑥"}
NUMBER_COLORS = {1:"bright_blue", 2:"bright_cyan", 3:"bright_green", 4:"yellow", 5:"bright_magenta", 6:"bright_red"}

RAINBOW = ["red", "bright_yellow", "green", "cyan", "blue", "magenta", "bright_white"]
_num_re_local = re.compile(r"-?\d+[\d,]*\.?\d*")

# ================== CLASS PHÂN TÍCH LOTTO ==================

class ThreeNumberAnalyzer:
    def __init__(self):
        self.position_stats = {0: defaultdict(lambda: Counter()), 1: defaultdict(lambda: Counter()), 2: defaultdict(lambda: Counter())}
        self.position_names = {0: "ĐẦU", 1: "GIỮA", 2: "CUỐI"}
        self.pattern_history = []
        self.last_seen_index = {0: {}, 1: {}, 2: {}}

    def _build_position_stats(self, history: List[Dict], decay: float = 0.06):
        self.pattern_history = []
        for p in [0,1,2]:
            self.position_stats[p] = defaultdict(lambda: Counter())
            self.last_seen_index[p] = {}
        n = max(1, len(history) - 1)
        for i in range(len(history) - 1):
            current = history[i].get('lucky_codes', [])
            next_codes = history[i + 1].get('lucky_codes', [])
            if len(current) == 3 and len(next_codes) == 3:
                distance = (n - 1) - i
                weight = float(math.exp(-decay * max(0, distance)))
                for pos in [0, 1, 2]:
                    trigger_num = current[pos]
                    result_num = next_codes[pos]
                    self.position_stats[pos][trigger_num][result_num] += weight
                self.pattern_history.append({'current': tuple(current), 'next': tuple(next_codes), 'current_sum': sum(current), 'next_sum': sum(next_codes)})
        for pos in [0,1,2]:
            seen = {}
            for dist, rec in enumerate(reversed(history)):
                codes = rec.get('lucky_codes', [])
                if not isinstance(codes, list) or len(codes) != 3:
                    continue
                num = codes[pos]
                if num not in seen:
                    seen[num] = dist
            self.last_seen_index[pos] = seen

    def _predict_position(self, position: int, current_num: int, context: Optional[Tuple[int,int,int]] = None) -> Dict:
        stats = self.position_stats[position][current_num]
        total = float(sum(stats.values()))
        if total == 0:
            return {i: 1/6 for i in range(1, 7)}
        probs = {i: stats.get(i, 0) / total for i in range(1, 7)}
        alpha = 0.5
        last_seen = self.last_seen_index.get(position, {})
        recency_boost = {}
        for i in range(1,7):
            dist = last_seen.get(i)
            if dist is None:
                recency_boost[i] = 1.0
            else:
                recency_boost[i] = 1.0 + max(0.0, (6.0 - float(dist)) / 12.0)
        smoothed = {}
        denom = total + 6 * alpha
        for i in range(1,7):
            base = (stats.get(i, 0) + alpha) / denom
            smoothed[i] = base * recency_boost.get(i, 1.0)
        s_sum = sum(smoothed.values())
        if s_sum <= 0:
            return {i: 1/6 for i in range(1, 7)}
        base_probs = {i: smoothed[i] / s_sum for i in range(1,7)}
        if context and self.pattern_history:
            boost = defaultdict(float)
            total_ctx = 0.0
            for idx, ph in enumerate(reversed(self.pattern_history)):
                cur = ph.get('current')
                nxt = ph.get('next')
                if not cur or not nxt: continue
                match = 0
                for p in range(3):
                    if p == position: continue
                    if context[p] == cur[p]:
                        match += 1
                if match >= 1:
                    recency_w = math.exp(-0.06 * idx)
                    observed = nxt[position]
                    boost[observed] += recency_w * (1.0 + match * 0.25)
                    total_ctx += recency_w
            if total_ctx > 0:
                ctx_probs = {i: (boost.get(i, 0.0) / total_ctx) for i in range(1,7)}
                mix = 0.25
                blended = {i: base_probs.get(i,0.0) * (1.0 - mix) + ctx_probs.get(i,0.0) * mix for i in range(1,7)}
                s = sum(blended.values())
                if s > 0:
                    return {i: blended[i]/s for i in range(1,7)}
        return base_probs

    def analyze(self, history: List[Dict]) -> Dict:
        if len(history) < 2:
            return {"last_three": [], "position_probs": [{}, {}, {}], "predicted_numbers": [], "predicted_sum": 0, "prediction": None, "confidence": 0.0, "bet_action": "small"}
        self._build_position_stats(history)
        last_record = history[-1]
        last_three = last_record.get('lucky_codes', [])
        if len(last_three) != 3:
            return {"last_three": last_three, "position_probs": [{}, {}, {}], "predicted_numbers": [], "predicted_sum": 0, "prediction": None, "confidence": 0.0, "bet_action": "small"}
        position_probs = []
        predicted_numbers = []
        total_confidence = 0.0
        per_number_details = []
        for pos in [0, 1, 2]:
            current_num = last_three[pos]
            probs = self._predict_position(pos, current_num, context=last_three)
            details = {}
            counts = self.position_stats[pos]
            sample_size = float(sum(counts.get(current_num, Counter()).values())) if counts.get(current_num) else 0.0
            for num in range(1,7):
                prob = probs.get(num, 0.0)
                dist = self.last_seen_index.get(pos, {}).get(num)
                recency_score = 0.0 if dist is None else max(0.0, (12.0 - float(dist)) / 12.0)
                freq = 0
                for k,v in self.position_stats[pos].items():
                    freq += v.get(num, 0)
                freq_score = float(freq) / max(1.0, sum(sum(c.values()) for c in self.position_stats[pos].values()))
                score = prob * 0.6 + recency_score * 0.25 + freq_score * 0.15
                details[num] = {'prob': prob, 'recency_score': recency_score, 'freq': freq, 'freq_score': freq_score, 'score': score}
            position_probs.append(probs)
            best_num = max(details.items(), key=lambda x: x[1]['score'])[0]
            predicted_numbers.append(best_num)
            total_confidence += details[best_num]['prob']
            per_number_details.append({'position': pos, 'current': current_num, 'sample_size': sample_size, 'details': details})
        predicted_sum = sum(predicted_numbers)
        avg_confidence = total_confidence / 3
        if 3 <= predicted_sum <= 9:
            bet_action = "small"
            prediction = "SMALL"
        elif 10 <= predicted_sum <= 11:
            bet_action = "draw"
            prediction = "DRAW"
        elif 12 <= predicted_sum <= 18:
            bet_action = "big"
            prediction = "BIG"
        else:
            bet_action = "small"
            prediction = "SMALL"
        sample_sizes = []
        for pos in [0, 1, 2]:
            current_num = last_three[pos]
            stats = self.position_stats[pos][current_num]
            sample_sizes.append(sum(stats.values()))
        avg_sample = sum(sample_sizes) / 3 if sample_sizes else 0
        try:
            ent = 0.0
            for probs in position_probs:
                s = 0.0
                for p in probs.values():
                    if p > 0: s -= p * math.log(p)
                ent += s
            avg_entropy = ent / 3.0 if position_probs else 0.0
            entropy_penalty = avg_entropy / max(1.0, math.log(6))
            avg_confidence *= max(0.25, 1.0 - 0.5 * entropy_penalty)
        except Exception:
            pass
        if avg_sample < 3:
            avg_confidence *= 0.55
        elif avg_sample < 6:
            avg_confidence *= 0.8
        return {"last_three": last_three, "position_probs": position_probs, "predicted_numbers": predicted_numbers, "predicted_sum": predicted_sum, "prediction": prediction, "confidence": avg_confidence, "sample_sizes": sample_sizes, "bet_action": bet_action, "per_position_details": per_number_details}

class AccountManager:
    def __init__(self, path: str = ACCOUNTS_FILE):
        self.path = path
        self.accounts = self._load()

    def _load(self) -> List[Dict]:
        if not os.path.exists(self.path):
            return []
        try:
            with open(self.path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def save(self) -> None:
        with open(self.path, "w", encoding="utf-8") as f:
            json.dump(self.accounts, f, ensure_ascii=False, indent=2)

    def parse_link_to_account(self, link: str) -> Optional[Dict]:
        try:
            p = urlparse(link)
            qs = parse_qs(p.query)
            user_ids = qs.get('userId') or qs.get('userid') or qs.get('user-id') or qs.get('user')
            secrets = qs.get('secretKey') or qs.get('secretkey') or qs.get('secret')
            if user_ids and secrets:
                user_id = user_ids[0]
                secret = secrets[0]
                return {"user-id": user_id, "user-secret-key": secret, "country-code": 'vn', "user-agent": 'Mozilla/5.0', "asset": 'BUILD'}
        except Exception:
            return None
        return None

    def add_account(self) -> Dict:
        raw = Prompt.ask("Dán link đăng nhập hoặc nhập user-id (hủy để thoát)", default="")
        if raw.strip() == "":
            raise KeyboardInterrupt
        acc = None
        if raw.startswith('http') or 'userId' in raw or 'secretKey' in raw:
            acc = self.parse_link_to_account(raw)
            if acc:
                console.print(Panel("✅ Phát hiện: user-id=" + acc['user-id'], style="green"))
        if not acc:
            user_id = raw if raw and not raw.startswith('http') else Prompt.ask("user-id")
            secret = getpass("secret-key: ")
            country = Prompt.ask("country-code", default="vn")
            agent = Prompt.ask("user-agent", default="Mozilla/5.0")
            asset = Prompt.ask("asset", default="BUILD")
            acc = {"user-id": user_id, "user-secret-key": secret, "country-code": country, "user-agent": agent, "asset": asset}
        self.accounts.append(acc)
        self.save()
        return acc

    def remove_account(self, index: int) -> bool:
        if 0 <= index < len(self.accounts):
            self.accounts.pop(index)
            self.save()
            return True
        return False

    def select_account(self) -> Optional[Dict]:
        if not self.accounts:
            console.print(Panel("❌ Chưa có tài khoản. Dùng 'Thêm tài khoản' để dán link nhanh.", style="bold red", border_style="red"))
            return None
        table = Table(show_header=True, header_style=f"bold {TBTOOL_COLORS['gold']}", box=box.ROUNDED, border_style=TBTOOL_COLORS["neon_blue"], title=f"{ICONS['lotto']} DANH SÁCH TÀI KHOẢN", title_style=f"bold {TBTOOL_COLORS['gold']}")
        table.add_column("STT", justify="center", style=f"bold {TBTOOL_COLORS['gold']}", width=6)
        table.add_column(f"{ICONS['user']} User ID", justify="left", style=TBTOOL_COLORS["platinum"], width=25)
        table.add_column(f"{ICONS['diamond']} Asset", justify="center", style=TBTOOL_COLORS["emerald"], width=10)
        table.add_column(f"{ICONS['star']} Country", justify="center", style=TBTOOL_COLORS["neon_blue"], width=10)
        for i, acc in enumerate(self.accounts, start=1):
            uid = acc.get('user-id', '<no-id>')
            asset = acc.get('asset', 'BUILD')
            country = acc.get('country-code', 'vn').upper()
            table.add_row(f"{i}", uid, asset, country)
        console.print(table)
        choice = Prompt.ask(f"[bold {TBTOOL_COLORS['gold']}]👉 Chọn tài khoản số (0 để hủy)[/bold {TBTOOL_COLORS['gold']}]", default="0")
        try:
            idx = int(choice) - 1
            if idx == -1:
                return None
            if 0 <= idx < len(self.accounts):
                selected = self.accounts[idx]
                console.print(Panel(f"✅ Đã chọn: [bold {TBTOOL_COLORS['gold']}]{selected['user-id']}[/bold {TBTOOL_COLORS['gold']}]", style="bold green", border_style=TBTOOL_COLORS["emerald"], box=box.ROUNDED))
                return selected
        except Exception:
            pass
        console.print(Panel("⚠️ Lựa chọn không hợp lệ", style="bold yellow", border_style="yellow"))
        return None

class MartingaleBetting:
    def __init__(self, initial_bet: float, multiplier: float, asset: str):
        self.initial_bet = float(initial_bet)
        self.multiplier = float(multiplier)
        self.asset = asset
        self.current_bet = float(initial_bet)
        self.total_wagered = 0.0
        self.total_won = 0.0
        self.win_count = 0
        self.loss_count = 0
        self.current_win_streak = 0
        self.current_loss_streak = 0
        self.max_win_streak = 0
        self.max_loss_streak = 0

    def get_bet_amount(self) -> float:
        return float(self.current_bet)

    def on_win(self, payout: float):
        try:
            self.total_won += float(payout)
        except Exception:
            pass
        self.win_count += 1
        self.current_bet = float(self.initial_bet)
        self.current_win_streak += 1
        self.current_loss_streak = 0
        if self.current_win_streak > self.max_win_streak:
            self.max_win_streak = self.current_win_streak

    def on_loss(self):
        self.loss_count += 1
        self.current_bet = float(self.current_bet) * float(self.multiplier)
        self.current_loss_streak += 1
        self.current_win_streak = 0
        if self.current_loss_streak > self.max_loss_streak:
            self.max_loss_streak = self.current_loss_streak

    def record_wager(self, amount: float):
        try:
            self.total_wagered += float(amount)
        except Exception:
            pass

    def get_stats(self) -> Dict:
        net_profit = self.total_won - self.total_wagered
        total_bets = self.win_count + self.loss_count
        return {"total_bets": total_bets, "wins": self.win_count, "losses": self.loss_count, "total_wagered": self.total_wagered, "total_won": self.total_won, "net_profit": net_profit, "current_bet": self.current_bet, "asset": self.asset, "current_win_streak": self.current_win_streak, "current_loss_streak": self.current_loss_streak, "max_win_streak": self.max_win_streak, "max_loss_streak": self.max_loss_streak}

def build_headers(config: Dict[str, str]) -> Dict[str, str]:
    return {'accept': '*/*', 'accept-language': 'en-US,en;q=0.9', 'country-code': config.get('country-code', 'vn'), 'origin': 'https://winhash.io', 'referer': 'https://winhash.io/', 'user-agent': config.get('user-agent', 'Mozilla/5.0'), 'user-id': config['user-id'], 'user-login': 'login_v2', 'user-secret-key': config['user-secret-key'], 'xb-language': config.get('xb-language', 'en-US')}

def fetch_issue_list(session: requests.Session, headers: Dict[str, str], ts: int) -> List[Dict]:
    params = {'ts': str(ts)}
    try:
        resp = session.get(API_URL, headers=headers, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, dict) and data.get('code') is not None and data.get('code') != 0:
            return []
        return data.get('data', []) if isinstance(data, dict) else (data if isinstance(data, list) else [])
    except Exception:
        return []

def fetch_home(session: requests.Session, headers: Dict[str, str], asset: str) -> Optional[Dict]:
    params = {'game_id': '1', 'asset': asset}
    try:
        resp = session.get(HOME_URL, headers=headers, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, dict) and data.get('code') is not None and data.get('code') != 0:
            return None
        return data.get('data') if isinstance(data, dict) else None
    except Exception:
        return None

def get_balance(s: requests.Session, headers: Dict[str, str], uid: str, key: str) -> Dict[str, Dict[str, float]]:
    h = headers.copy()
    h['user-id'] = uid
    h['user-secret-key'] = key
    try:
        payload = {'user_id': int(uid) if str(uid).isdigit() else uid, 'source': 'home'}
        r = s.post(API_URL_GET_BALANCE, headers=h, json=payload, timeout=10)
        r.raise_for_status()
        d = r.json()
        if isinstance(d, dict) and d.get('code') == 0:
            data = d.get('data') or {}
            ua = data.get('user_asset') or data
            build = None
            world = None
            usdt = None
            if isinstance(ua, dict):
                for k, v in ua.items():
                    k_norm = str(k).upper()
                    if k_norm in ('BUILD',):
                        if isinstance(v, dict):
                            build = _safe_round(v.get('balance') or v.get('amount') or 0.0)
                        else:
                            build = _safe_round(v)
                    if k_norm in ('WORLD', 'XWORLD'):
                        if isinstance(v, dict):
                            world = _safe_round(v.get('balance') or v.get('amount') or 0.0)
                        else:
                            world = _safe_round(v)
                    if k_norm in ('USDT',):
                        if isinstance(v, dict):
                            usdt = _safe_round(v.get('balance') or v.get('amount') or 0.0)
                        else:
                            usdt = _safe_round(v)
            build = 0.0 if build is None else build
            world = 0.0 if world is None else world
            usdt = 0.0 if usdt is None else usdt
            return {'BUILD': {'balance': build}, 'XWORLD': {'balance': world}, 'USDT': {'balance': usdt}}
    except Exception as e:
        logger.debug(f"get_balance error: {e}")
    return {'BUILD': {'balance': 0.0}, 'XWORLD': {'balance': 0.0}, 'USDT': {'balance': 0.0}}

def _safe_round(val: Any, ndigits: int = DECIMALS) -> float:
    try:
        return round(float(val), ndigits)
    except Exception:
        return 0.0

def _parse_number_local(x) -> Optional[float]:
    if x is None:
        return None
    if isinstance(x, (int, float)):
        return float(x)
    s = str(x)
    m = _num_re_local.search(s)
    if not m:
        return None
    token = m.group(0).replace(",", "")
    try:
        return float(token)
    except Exception:
        return None

def sum_to_label(total: int) -> str:
    try:
        total = int(total)
    except Exception:
        return "unknown"
    if 3 <= total <= 9:
        return "small"
    if 10 <= total <= 11:
        return "draw"
    if 12 <= total <= 18:
        return "big"
    return "unknown"

def get_balances_from_home(home: Dict) -> Dict[str, Optional[float]]:
    build = None
    world = None
    usdt = None
    if not isinstance(home, dict):
        return {"BUILD": None, "XWORLD": None, "USDT": None}
    ua = home.get('user_asset') or home.get('wallet') or home.get('assets') or {}
    if isinstance(ua, dict):
        if 'BUILD' in ua:
            build = _parse_number_local(ua.get('BUILD'))
        if 'WORLD' in ua:
            world = _parse_number_local(ua.get('WORLD'))
        if 'USDT' in ua:
            usdt = _parse_number_local(ua.get('USDT'))
    for k in ('build','ctoken','ctoken_contribute','balance','amount'):
        if build is None and k in home:
            build = _parse_number_local(home.get(k))
    for k in ('world','xworld','WORLD','XWORLD'):
        if world is None and k in home:
            world = _parse_number_local(home.get(k))
    for k in ('usdt','kusdt','USDT'):
        if usdt is None and k in home:
            usdt = _parse_number_local(home.get(k))
    if build is None or world is None or usdt is None:
        try:
            s = json.dumps(home)
            if build is None:
                m = re.search(r'(?:BUILD|build)[:\"\']*\s*([0-9\.,]+)', s, re.I)
                if m: build = _parse_number_local(m.group(1))
            if world is None:
                m = re.search(r'(?:WORLD|world|xworld)[:\"\']*\s*([0-9\.,]+)', s, re.I)
                if m: world = _parse_number_local(m.group(1))
            if usdt is None:
                m = re.search(r'(?:USDT|usdt|kusdt)[:\"\']*\s*([0-9\.,]+)', s, re.I)
                if m: usdt = _parse_number_local(m.group(1))
        except Exception:
            pass
    return {"BUILD": build, "XWORLD": world, "USDT": usdt}

def get_hour_start_timestamp(hour_offset: int = 0) -> int:
    now = datetime.now(timezone.utc)
    hour_start = now.replace(minute=0, second=0, microsecond=0)
    hour_start = hour_start - timedelta(hours=hour_offset)
    return int(hour_start.timestamp())

def compute_number_counts(history: List[Dict]) -> Dict[str, Any]:
    overall = Counter()
    per_pos = {0: Counter(), 1: Counter(), 2: Counter()}
    for rec in history:
        codes = rec.get('lucky_codes') or []
        if not isinstance(codes, list) or len(codes) != 3:
            continue
        for pos, num in enumerate(codes):
            per_pos[pos][num] += 1
            overall[num] += 1
    return {'overall': overall, 'per_pos': per_pos}

def issue_to_record(issue: Dict) -> Optional[Dict]:
    lucky_codes = issue.get('lucky_codes') or []
    if len(lucky_codes) != 3:
        return None
    total = sum(lucky_codes)
    return {'issue_id': issue.get('issue_id'), 'lucky_codes': lucky_codes, 'sum': total, 'result': sum_to_label(total)}

def home_to_record(home: Dict) -> Optional[Dict]:
    last_issue_id = home.get('last_issue_id')
    lucky_codes = home.get('last_issue_lucky_code') or []
    if last_issue_id is None or len(lucky_codes) != 3:
        return None
    total = sum(lucky_codes)
    return {'issue_id': last_issue_id, 'lucky_codes': lucky_codes, 'sum': total, 'result': sum_to_label(total)}

def place_bet(session: requests.Session, headers: Dict[str, str], issue_id: int, bet_type: str, amount: float, asset: str) -> tuple:
    bet_ids = {'small': 70309, 'big': 71218, 'draw': 71011}
    if bet_type not in bet_ids:
        return False, "Invalid bet type"
    payload = {"game_id": 1, "issue_id": issue_id, "items": [{"id": bet_ids[bet_type], "amount": str(amount), "asset": asset}]}
    try:
        resp = session.post('https://api.winhash.net/lucky_game/v2/create_order', headers=headers, json=payload, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            success = data.get('code') == 0
            error_msg = data.get('msg', 'Unknown error')
            return success, error_msg if not success else "Success"
        else:
            return False, f"HTTP {resp.status_code}"
    except Exception as e:
        return False, str(e)

def show_loading_animation(duration: float = 2.0, text: str = "Đang khởi động"):
    try:
        with Progress(SpinnerColumn(spinner_name="dots", style="bold bright_cyan"), TextColumn(f"[bold {TBTOOL_COLORS['gold']}]{text}"), BarColumn(bar_width=40, style=TBTOOL_COLORS["neon_blue"], complete_style=TBTOOL_COLORS["emerald"]), TextColumn("[progress.percentage]{task.percentage:>3.0f}%"), console=console, transient=True) as progress:
            task = progress.add_task(f"[bold {TBTOOL_COLORS['neon_pink']}]✨ {text} ✨", total=100)
            steps = 50
            for i in range(steps):
                progress.update(task, advance=100/steps)
                time.sleep(duration/steps)
    except Exception:
        pass

def make_tbtool_header(tick: int = 0) -> Panel:
    logo_text = build_logo_with_gradient(LOGO_TBTOOL)
    subtitle = Text.assemble((f" {ICONS['lotto']} ", f"bold {TBTOOL_COLORS['neon_pink']}"), ("LOTTO AI VIP PREMIUM", f"bold {TBTOOL_COLORS['gold']}"), (f" {ICONS['lotto']} ", f"bold {TBTOOL_COLORS['neon_pink']}"), ("\n", ""), (f"🔬 Powered by ", "dim"), (f"TBTOOL AI", f"bold {TBTOOL_COLORS['neon_blue']}"), (f" v2.0", "dim"), ("\n", ""))
    admin_info = Text.assemble(("\n", ""), ("━" * 60 + "\n", f"dim {TBTOOL_COLORS['gold']}"), (f"{ICONS['crown']} ", f"bold {TBTOOL_COLORS['gold']}"), ("ADMIN: ", f"bold {TBTOOL_COLORS['platinum']}"), ("Thanh Bình", f"bold {TBTOOL_COLORS['neon_pink']}"), ("  |  ", "dim"), (f"{ICONS['star']} ", f"bold {TBTOOL_COLORS['gold']}"), ("MOD: ", f"bold {TBTOOL_COLORS['platinum']}"), ("T.Hưng", f"bold {TBTOOL_COLORS['neon_blue']}"), ("\n", ""), (f"{ICONS['phone']} ", f"bold {TBTOOL_COLORS['gold']}"), ("Liên hệ mua Key VIP: ", f"bold {TBTOOL_COLORS['platinum']}"), ("0365463767", f"bold {TBTOOL_COLORS['neon_green']}"), ("\n", ""), ("━" * 60 + "\n", f"dim {TBTOOL_COLORS['gold']}"), ("\n", ""))
    return Panel(Group(Align.center(logo_text), Align.center(subtitle), Align.center(admin_info)), border_style=TBTOOL_COLORS["gold"], box=box.DOUBLE, padding=(0, 2))

def make_tbtool_menu() -> Panel:
    t = Text()
    t.append("\n", "")
    t.append("╔═══════════════════════════════════════════╗\n", TBTOOL_COLORS["gold"])
    t.append("║   ", TBTOOL_COLORS["gold"])
    t.append(f"{ICONS['settings']} MENU CHÍNH", f"bold {TBTOOL_COLORS['neon_blue']}")
    t.append("                        ║\n", TBTOOL_COLORS["gold"])
    t.append("╚═══════════════════════════════════════════╝\n\n", TBTOOL_COLORS["gold"])
    menu_items = [("1", f"{ICONS['user']} Chọn tài khoản", TBTOOL_COLORS["emerald"]), ("2", f"{ICONS['plus']} Thêm tài khoản", TBTOOL_COLORS["neon_blue"]), ("3", f"{ICONS['cross']} Xóa tài khoản", TBTOOL_COLORS["ruby"]), ("4", f"{ICONS['chart']} Xem danh sách", TBTOOL_COLORS["neon_pink"]), ("5", f"{ICONS['settings']} Dùng config file", TBTOOL_COLORS["gold"])]
    for num, text, color in menu_items:
        t.append(f" {num}. ", style=f"bold {TBTOOL_COLORS['gold']}")
        t.append(f"{text}\n", style=color)
    t.append("\n", "")
    t.append("━" * 40, style="dim")
    t.append(f"\n{ICONS['crown']} ", style=TBTOOL_COLORS["gold"])
    t.append("ADMIN: ", style="dim")
    t.append("Thanh Bình", style=f"bold {TBTOOL_COLORS['neon_pink']}")
    t.append("  |  ", style="dim")
    t.append("MOD: ", style="dim")
    t.append("T.Hưng", style=f"bold {TBTOOL_COLORS['neon_blue']}")
    t.append("\n", "")
    t.append(f"{ICONS['phone']} ", style=TBTOOL_COLORS["gold"])
    t.append("LH mua Key: ", style="dim")
    t.append("0365463767", style=f"bold {TBTOOL_COLORS['neon_green']}")
    return Panel(Align.center(t), border_style=TBTOOL_COLORS["neon_blue"], box=box.ROUNDED, padding=(1, 2))

def make_tbtool_compact_panel(state: Dict, tick: int = 0) -> Panel:
    balances = state.get('balances') or {}
    def _fmt_bal(b):
        try:
            if b is None: return '—'
            if isinstance(b, dict): return f"{_safe_round(b.get('balance',0)):.2f}"
            return f"{_safe_round(b):.2f}"
        except: return '—'
    b_build = _fmt_bal(balances.get('BUILD'))
    b_x = _fmt_bal(balances.get('XWORLD'))
    last_issue = state.get('last_issue', '—')
    last_result = state.get('last_result', '—')
    next_pred = state.get('next_prediction', '—')
    conf = state.get('next_confidence', 0.0)
    analysis = state.get('three_number_analysis', {})
    last_three = analysis.get('last_three', [])
    predicted_numbers = analysis.get('predicted_numbers', [])
    predicted_sum = analysis.get('predicted_sum', 0)
    start_bal = None
    if isinstance(state.get('start_balances'), dict):
        try:
            start_bal = float(state['start_balances'].get('BUILD', {}).get('balance'))
        except: pass
    cur_bal = None
    try:
        b = balances.get('BUILD')
        if isinstance(b, dict): cur_bal = b.get('balance')
        else: cur_bal = float(b) if b else None
    except: pass
    t = Text()
    t.append(f"\n🔥 ", style=TBTOOL_COLORS["ruby"])
    t.append("TBTOOL VIP", style=f"bold {TBTOOL_COLORS['gold']}")
    t.append(" 🔥", style=TBTOOL_COLORS["ruby"])
    t.append(" | ", style="dim")
    t.append(f"{ICONS['user']} {state.get('account_id', '—')}", style=TBTOOL_COLORS["neon_blue"])
    t.append("\n" + "━" * 78 + "\n", style=TBTOOL_COLORS["gold"])
    t.append(f"{ICONS['diamond']} ", style=TBTOOL_COLORS["gold"])
    t.append(f"BUILD: {b_build}", style=f"bold {TBTOOL_COLORS['emerald']}")
    t.append("  ", style="dim")
    t.append(f"🌍 XW: {b_x}", style=TBTOOL_COLORS["neon_blue"])
    t.append("  |  ", style="dim")
    t.append(f"📍 #{last_issue}: {last_result}", style=TBTOOL_COLORS["platinum"])
    if start_bal is not None and cur_bal is not None:
        diff = _safe_round(cur_bal - start_bal, DECIMALS)
        pct = (diff / start_bal * 100.0) if (start_bal and start_bal != 0) else 0.0
        sign = "+" if diff > 0 else ""
        if diff > 0:
            arrow, style = "🚀", f"bold {TBTOOL_COLORS['emerald']}"
        elif diff < 0:
            arrow, style = "💔", f"bold {TBTOOL_COLORS['ruby']}"
        else:
            arrow, style = "➡️", TBTOOL_COLORS["gold"]
        t.append(f"  {arrow} ", style=style)
        t.append(f"{sign}{diff:.2f}", style=style)
        t.append(f" ({sign}{pct:.1f}%)", style=style)
    t.append("\n" + "─" * 78 + "\n", style="dim")
    t.append(f"{ICONS['dice']} Hiện tại: ", style="dim")
    for num in last_three:
        icon = ICON_LOTTO.get(num, str(num))
        color = NUMBER_COLORS.get(num, "white")
        t.append(f"{icon} ", style=f"bold {color}")
    t.append("  →  ", style="dim")
    t.append("Dự đoán: ", style="dim")
    for num in predicted_numbers:
        icon = ICON_LOTTO.get(num, str(num))
        color = NUMBER_COLORS.get(num, "white")
        t.append(f"{icon} ", style=f"bold {color}")
    t.append(f"(Σ={predicted_sum})", style=TBTOOL_COLORS["gold"])
    t.append("\n")
    t.append(f"{ICONS['target']} Cược tiếp: ", style="dim")
    t.append(f"{next_pred}", style=f"bold {TBTOOL_COLORS['neon_pink']}")
    if conf:
        conf_bar = int(conf * 12)
        conf_style = TBTOOL_COLORS["emerald"] if conf >= 0.7 else (TBTOOL_COLORS["gold"] if conf >= 0.5 else TBTOOL_COLORS["ruby"])
        t.append("  [", style="dim")
        t.append("█" * conf_bar, style=conf_style)
        t.append("░" * (12 - conf_bar), style="dim")
        t.append(f" {conf*100:.0f}%]", style=conf_style)
    hist = state.get('history', []) or []
    counts = compute_number_counts(hist) if hist else {'overall': Counter(), 'per_pos': {0: Counter(), 1: Counter(), 2: Counter()}}
    overall = counts.get('overall', {})
    if overall:
        t.append("\n", "")
        t.append("🔥❄️ Hot/Cold: ", style="dim")
        maxc = max(overall.values()) if overall else 1
        for n in range(1,7):
            c = overall.get(n, 0)
            color = NUMBER_COLORS.get(n, 'white')
            bl = int((c / maxc) * 6) if maxc else 0
            bars = '█' * bl + ' ' * (6 - bl)
            t.append(f" {ICON_LOTTO.get(n)}", style=f"bold {color}")
            t.append(bars, style=color)
    t.append("\n" + "─" * 78 + "\n", style="dim")
    model_stats = state.get('model_stats', {})
    wins = model_stats.get('wins', 0)
    losses = model_stats.get('losses', 0)
    total_pred = model_stats.get('predictions', 0)
    t.append(f"{ICONS['chart']} Tổng: ", style="dim")
    t.append(f"{total_pred} ván", style=TBTOOL_COLORS["platinum"])
    t.append("  |  ✅ ", style="dim")
    t.append(f"{wins}", style=TBTOOL_COLORS["emerald"])
    t.append("  ❌ ", style="dim")
    t.append(f"{losses}", style=TBTOOL_COLORS["ruby"])
    if total_pred > 0:
        win_rate = (wins / total_pred * 100)
        t.append(f"  |  Tỷ lệ: ", style="dim")
        t.append(f"{win_rate:.0f}%", style=f"bold {TBTOOL_COLORS['neon_blue']}")
    bet_stats = state.get('bet_stats')
    if bet_stats:
        win_streak = bet_stats.get('current_win_streak', 0)
        loss_streak = bet_stats.get('current_loss_streak', 0)
        if win_streak > 0:
            t.append("\n", "")
            t.append(f"{ICONS['fire']} Chuỗi thắng: ", style=TBTOOL_COLORS["emerald"])
            t.append(f"{win_streak}", style=f"bold {TBTOOL_COLORS['emerald']}")
            if win_streak >= 3:
                t.append(" 🏆", style=TBTOOL_COLORS["gold"])
        if loss_streak > 0:
            t.append("\n", "")
            t.append(f"💀 Chuỗi thua: ", style=TBTOOL_COLORS["ruby"])
            t.append(f"{loss_streak}", style=f"bold {TBTOOL_COLORS['ruby']}")
            if loss_streak >= 3:
                t.append(" ⚠️", style=TBTOOL_COLORS["gold"])
        t.append("\n", "")
        total_wagered = bet_stats.get('total_wagered', 0)
        if start_bal is not None and cur_bal is not None:
            net_profit = _safe_round(cur_bal - start_bal, DECIMALS)
        else:
            net_profit = bet_stats.get('net_profit', 0)
        asset = bet_stats.get('asset', 'BUILD')
        t.append(f"{ICONS['money']} Đã cược: ", style="dim")
        t.append(f"{total_wagered:.2f} {asset}", style=TBTOOL_COLORS["gold"])
        profit_style = f"bold {TBTOOL_COLORS['emerald']}" if net_profit > 0 else (f"bold {TBTOOL_COLORS['ruby']}" if net_profit < 0 else TBTOOL_COLORS["gold"])
        t.append(f"  |  {ICONS['chart']} P/L: ", style="dim")
        t.append(f"{net_profit:+.2f} {asset}", style=profit_style)
    log_text = state.get('log_text', '—')
    t.append("\n" + "─" * 78 + "\n", style="dim")
    t.append(f"{ICONS['info']} ", style=TBTOOL_COLORS["neon_blue"])
    t.append(log_text, style=TBTOOL_COLORS["platinum"])
    t.append("\n", "")
    return Panel(t, title=f"🌟 LOTTO AI BY TBTOOL 🌟", border_style=TBTOOL_COLORS["gold"], box=box.SIMPLE_HEAVY, padding=(0, 1))

def make_tbtool_history_cards(history: List[Dict], limit: int = 5, cols: int = 1, tick: int = 0, highlight_issue: Optional[int] = None) -> Panel:
    recent = list(reversed(history[-limit:]))
    cards = []
    for rec in recent:
        issue = rec.get('issue_id')
        ts = rec.get('timestamp', '')
        short_ts = ts[11:19] if isinstance(ts, str) and len(ts) >= 19 else ''
        codes = rec.get('lucky_codes', [])
        code_line = Text()
        for i, n in enumerate(codes):
            color = NUMBER_COLORS.get(n, 'white')
            code_line.append(f" {ICON_LOTTO.get(n)} ", style=f"bold {color}")
            if i < len(codes)-1:
                code_line.append(' ', style='dim')
        kq = rec.get('result', '—')
        if kq == 'small':
            kq_style = f"bold white on {TBTOOL_COLORS['sapphire']}"
            kq_icon = '🔵'
        elif kq == 'big':
            kq_style = f"bold white on {TBTOOL_COLORS['ruby']}"
            kq_icon = '🔴'
        else:
            kq_style = f"bold black on {TBTOOL_COLORS['gold']}"
            kq_icon = '⚖️'
        bet = rec.get('bet') or {}
        pl = None
        try:
            bb = bet.get('balance_before')
            ba = bet.get('balance_after')
            if bb is not None and ba is not None:
                pl = float(ba) - float(bb)
            else:
                pl = bet.get('profit')
        except Exception:
            pl = bet.get('profit') if bet else None
        if pl is None:
            pl_text = Text('—', style='dim')
        elif pl > 0:
            pl_text = Text(f'+{pl:.2f}', style=f'bold {TBTOOL_COLORS["emerald"]}')
        elif pl < 0:
            pl_text = Text(f'{pl:.2f}', style=f'bold {TBTOOL_COLORS["ruby"]}')
        else:
            pl_text = Text(f'{pl:.2f}', style=TBTOOL_COLORS["gold"])
        bs = TBTOOL_COLORS["onyx"]
        if highlight_issue is not None and issue == highlight_issue:
            bs = TBTOOL_COLORS["gold"]
        card = Panel(Align.left(Text.assemble(Text(f"#{str(issue)[-4:]} ", style=f'bold {TBTOOL_COLORS["neon_blue"]}'), Text(short_ts + '\n', style='dim'), code_line, Text('\n', ''), Text.assemble(Text(kq_icon + ' ', style=kq_style), Text(' ', ''), pl_text))), box=box.ROUNDED, padding=(0, 1), border_style=bs)
        cards.append(card)
    if not cards:
        return Panel(Text('⏳ Không có lịch sử', style='dim'), border_style=TBTOOL_COLORS["onyx"])
    return Panel(Columns(cards, equal=True, expand=True), title=f"{ICONS['chart']} LỊCH SỬ GẦN ĐÂY", border_style=TBTOOL_COLORS["neon_blue"], box=box.ROUNDED)

def make_tbtool_layout(state: Dict) -> Layout:
    layout = Layout(name='root')
    layout.split_column(Layout(name='header', size=8), Layout(name='body', ratio=1), Layout(name='footer', size=2))
    layout['body'].split_row(Layout(name='main', ratio=3), Layout(name='sep', size=1), Layout(name='history', size=35))
    tick = state.get('tick', 0)
    layout['header'].update(make_tbtool_header(tick))
    layout['main'].update(make_tbtool_compact_panel(state, tick))
    history_panel = make_tbtool_history_cards(state.get('history', []), limit=5, cols=1, tick=tick, highlight_issue=state.get('last_issue'))
    layout['history'].update(history_panel)
    sep_panel = Panel(Text('│', style='dim'), box=box.SQUARE, padding=(0,0), border_style='bright_black')
    layout['sep'].update(sep_panel)
    footer_text = Text()
    footer_text.append("Ctrl+C=Thoát", style="dim")
    footer_text.append("  •  ", style=TBTOOL_COLORS["gold"])
    footer_text.append(f"{ICONS['crown']} TBTOOL VIP", style=f"bold {TBTOOL_COLORS['neon_pink']}")
    footer_text.append("  •  ", style=TBTOOL_COLORS["gold"])
    footer_text.append(f"{ICONS['phone']} 0365463767", style=f"bold {TBTOOL_COLORS['neon_green']}")
    layout['footer'].update(Panel(Align.center(footer_text), padding=(0, 0), border_style=TBTOOL_COLORS["gold"]))
    return layout

def main_lotto():
    console.clear()
    show_loading_animation(0.8, "Khởi động TBTOOL VIP")
    am = AccountManager()
    selected_account = None
    while selected_account is None:
        console.clear()
        console.print(make_tbtool_header(0))
        console.print(make_tbtool_menu())
        choice = Prompt.ask(f"[bold {TBTOOL_COLORS['gold']}]👉 Chọn chức năng[/bold {TBTOOL_COLORS['gold']}]", choices=['1','2','3','4','5'], default='5')
        if choice == '1':
            acc = am.select_account()
            if acc:
                selected_account = acc
        elif choice == '2':
            try:
                acc = am.add_account()
                console.print(Panel(f"✅ Đã thêm tài khoản: [bold {TBTOOL_COLORS['gold']}]{acc.get('user-id')}[/bold {TBTOOL_COLORS['gold']}]", style='bold green', border_style=TBTOOL_COLORS["emerald"], box=box.ROUNDED))
            except KeyboardInterrupt:
                console.print(Panel('❌ Đã hủy', style='dim', border_style='dim'))
        elif choice == '3':
            if not am.accounts:
                console.print(Panel('❌ Chưa có tài khoản', style='bold red', border_style='red'))
                continue
            table = Table(show_header=True, header_style=f"bold {TBTOOL_COLORS['ruby']}", box=box.ROUNDED, border_style=TBTOOL_COLORS["ruby"], title=f"{ICONS['cross']} XÓA TÀI KHOẢN", title_style=f"bold {TBTOOL_COLORS['gold']}")
            table.add_column("STT", justify="center", style=f"bold {TBTOOL_COLORS['gold']}", width=6)
            table.add_column(f"{ICONS['user']} User ID", justify="left", style=TBTOOL_COLORS["platinum"], width=30)
            for i, acc in enumerate(am.accounts, start=1):
                table.add_row(str(i), acc.get('user-id', '<no-id>'))
            console.print(table)
            idx = Prompt.ask(f"[bold {TBTOOL_COLORS['ruby']}]👉 Số cần xóa (0 để hủy)[/bold {TBTOOL_COLORS['ruby']}]", default='0')
            try:
                i = int(idx)-1
                if i >= 0 and i < len(am.accounts):
                    deleted_uid = am.accounts[i].get('user-id')
                    if am.remove_account(i):
                        console.print(Panel(f"🗑️ Đã xóa: [bold {TBTOOL_COLORS['gold']}]{deleted_uid}[/bold {TBTOOL_COLORS['gold']}]", style='bold red', border_style=TBTOOL_COLORS["ruby"]))
            except Exception:
                console.print(Panel('⚠️ Lỗi nhập liệu', style='bold yellow', border_style='yellow'))
        elif choice == '4':
            if not am.accounts:
                console.print(Panel('❌ Chưa có tài khoản', style='bold red', border_style='red'))
            else:
                table = Table(show_header=True, header_style=f"bold {TBTOOL_COLORS['gold']}", box=box.DOUBLE, border_style=TBTOOL_COLORS["neon_blue"], title=f"{ICONS['chart']} DANH SÁCH TÀI KHOẢN", title_style=f"bold {TBTOOL_COLORS['gold']}")
                table.add_column("STT", justify="center", style=f"bold {TBTOOL_COLORS['gold']}", width=6)
                table.add_column(f"{ICONS['user']} User ID", justify="left", style=TBTOOL_COLORS["platinum"], width=25)
                table.add_column(f"{ICONS['diamond']} Asset", justify="center", style=TBTOOL_COLORS["emerald"], width=10)
                table.add_column(f"{ICONS['star']} Country", justify="center", style=TBTOOL_COLORS["neon_blue"], width=10)
                for i, acc in enumerate(am.accounts, start=1):
                    table.add_row(str(i), acc.get('user-id', '<no-id>'), acc.get('asset', 'BUILD'), acc.get('country-code', 'vn').upper())
                console.print(table)
            Prompt.ask(f"[bold {TBTOOL_COLORS['gold']}]↩️ Enter để tiếp tục[/bold {TBTOOL_COLORS['gold']}]", default='')
        elif choice == '5':
            if os.path.exists(CONFIG_FILE):
                try:
                    with open(CONFIG_FILE,'r',encoding='utf-8') as f:
                        cfg = json.load(f)
                    selected_account = {"user-id": cfg.get("user-id"), "user-secret-key": cfg.get("user-secret-key"), "country-code": cfg.get("country-code", "vn"), "user-agent": cfg.get("user-agent", "Mozilla/5.0"), "asset": cfg.get("asset","BUILD")}
                    console.print(Panel(f"⚙️ Đã tải config: [bold {TBTOOL_COLORS['gold']}]{selected_account.get('user-id')}[/bold {TBTOOL_COLORS['gold']}]", style='bold green', border_style=TBTOOL_COLORS["emerald"], box=box.ROUNDED))
                except Exception:
                    console.print(Panel('❌ Không đọc được file config', style='bold red', border_style='red'))
            else:
                console.print(Panel('⚠️ Chưa có file config. Vui lòng thêm hoặc chọn tài khoản.', style='bold yellow', border_style='yellow'))
    _, _, is_vip = check_activation_valid()
    is_admin = is_admin_activated()
    if is_admin:
        console.print(f"[bold red]👑 ADMIN MODE ACTIVATED[/bold red]")
    elif is_vip:
        console.print(f"[bold {TBTOOL_COLORS['gold']}]👑 VIP MODE ACTIVATED - Logic Đảo Ngược TBTOOL VIP[/bold {TBTOOL_COLORS['gold']}]")
    config = {"user-id": selected_account["user-id"], "user-secret-key": selected_account["user-secret-key"], "country-code": selected_account.get("country-code","vn"), "user-agent": selected_account.get("user-agent","Mozilla/5.0"), "asset": selected_account.get("asset","BUILD")}
    with open(CONFIG_FILE,'w',encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)
    headers = build_headers(config)
    session = requests.Session()
    asset = config.get('asset','BUILD')
    bet_per_round = float(Prompt.ask(f"[bold {TBTOOL_COLORS['gold']}]Cược mỗi ván?[/bold {TBTOOL_COLORS['gold']}]", default='1'))
    multiplier = float(Prompt.ask(f"[bold {TBTOOL_COLORS['gold']}]Nhân sau thua[/bold {TBTOOL_COLORS['gold']}]", default='2'))
    enable_betting = Confirm.ask(f"[bold {TBTOOL_COLORS['gold']}]Bật auto-cược?[/bold {TBTOOL_COLORS['gold']}]", default=False)
    betting_system = MartingaleBetting(bet_per_round, multiplier, asset) if enable_betting else None
    show_loading_animation(0.8, "Tải lịch sử phiên")
    current_ts = get_hour_start_timestamp(0)
    previous_ts = get_hour_start_timestamp(1)
    issues = {}
    for issue in fetch_issue_list(session, headers, previous_ts) + fetch_issue_list(session, headers, current_ts):
        if issue.get('issue_id'):
            issues[issue['issue_id']] = issue
    history = [issue_to_record(i) for i in sorted(issues.values(), key=lambda x: x['issue_id']) if issue_to_record(i)]
    if not history:
        console.print('[bold red]❌ Không có lịch sử. Kiểm tra kết nối/config.[/bold red]')
        return
    three_number_analyzer = ThreeNumberAnalyzer()
    last_processed = max(h['issue_id'] for h in history)
    pending = {}
    pending_bets = {}
    stop = False
    def handle_stop(_sig, _frame):
        nonlocal stop
        stop = True
    signal.signal(signal.SIGINT, handle_stop)
    state = {
        'account_id': selected_account.get('user-id') if selected_account else None,
        'balances': {"BUILD": None, "XWORLD": None, "USDT": None},
        'start_balances': {},
        'last_result': '—',
        'last_issue': '—',
        'next_prediction': '—',
        'next_confidence': None,
        'planned_bet': 0.0,
        'history_table': None,
        'history': history,
        'three_number_analysis': three_number_analyzer.analyze(history),
        'bet_stats': None,
        'model_stats': {'predictions':0, 'wins':0, 'losses':0, 'current_streak':0},
        'log_text': 'Sẵn sàng ✅',
        'tick': 0,
        'asset': asset,
        'is_vip': is_vip,
        'is_admin': is_admin
    }
    console.clear()
    show_loading_animation(0.6, "Bắt đầu phân tích AI")
    with Live(make_tbtool_layout(state), console=console, refresh_per_second=UI_REFRESH) as live:
        while not stop:
            state['tick'] = (state.get('tick', 0) + 1) % 1000000
            try:
                state['history_table'] = make_tbtool_history_cards(state.get('history', []), limit=5, cols=1, tick=state.get('tick', 0), highlight_issue=state.get('last_issue'))
            except Exception:
                pass
            try:
                uid = selected_account.get('user-id')
                key = selected_account.get('user-secret-key')
                if uid and key:
                    bmap = get_balance(session, headers, uid, key)
                    if isinstance(bmap, dict):
                        state['balances'] = bmap
                        if not state.get('start_balances'):
                            state['start_balances'] = {k: {'balance': float(v.get('balance',0)) if isinstance(v, dict) else _safe_round(v)} for k,v in bmap.items()}
                            state['log_text'] = 'Đã lưu số dư khởi điểm'
            except Exception:
                logger.debug("Wallet API read failed")
            home_data = fetch_home(session, headers, asset)
            if not home_data:
                state['log_text'] = 'Chờ dữ liệu...'
                try:
                    live.update(make_tbtool_layout(state))
                except Exception:
                    pass
                time.sleep(HOME_POLL_INTERVAL)
                continue
            try:
                if state['balances'] and all((_safe_round(state['balances'].get(k, {}).get('balance', 0)) == 0.0 for k in ('BUILD','XWORLD','USDT'))):
                    hb = get_balances_from_home(home_data)
                    for k in ('BUILD','XWORLD','USDT'):
                        v = hb.get(k)
                        if v is not None:
                            state['balances'][k] = {'balance': _safe_round(v)}
                    if state['balances'] and not state.get('start_balances'):
                        state['start_balances'] = {k: {'balance': float(v.get('balance',0)) if isinstance(v, dict) else _safe_round(v)} for k,v in state['balances'].items()}
            except Exception:
                pass
            last_id = home_data.get('last_issue_id')
            if last_id and last_id > last_processed:
                record = home_to_record(home_data)
                if record:
                    last_processed = record['issue_id']
                    actual = record['result']
                    decision = pending.pop(record['issue_id'], None)
                    bet_info = pending_bets.pop(record['issue_id'], None)
                    state['last_issue'] = record['issue_id']
                    state['last_result'] = f"{actual.upper()} ({record['sum']})"
                    if decision:
                        predicted_bet = decision.get('bet_action', 'small')
                        if state.get('is_vip', False) or state.get('is_admin', False):
                            if predicted_bet == 'small':
                                predicted_bet = 'big'
                            elif predicted_bet == 'big':
                                predicted_bet = 'small'
                            state['log_text'] = f"👑 VIP/Admin Đảo ngược: {decision.get('bet_action', 'small')} → {predicted_bet}"
                        correct = (actual == predicted_bet)
                        result_emoji = '✅' if correct else '❌'
                        state['log_text'] = f"{result_emoji} #{record['issue_id']}: {predicted_bet.upper()} → {actual.upper()}"
                        if betting_system and bet_info:
                            if isinstance(bet_info, dict):
                                bet_type = bet_info.get('type')
                                bet_amount = float(bet_info.get('amount', 0.0))
                                b_before = bet_info.get('balance_before')
                            else:
                                try:
                                    bet_type, bet_amount = bet_info
                                    b_before = None
                                except Exception:
                                    bet_type, bet_amount, b_before = (None, 0.0, None)
                            try:
                                b_after = None
                                bmap = state.get('balances') or {}
                                bval = bmap.get('BUILD')
                                if isinstance(bval, dict):
                                    b_after = float(bval.get('balance', 0.0))
                                else:
                                    b_after = _safe_round(bval)
                            except Exception:
                                b_after = None
                            if correct:
                                payout = bet_amount * 2
                                betting_system.on_win(payout)
                            else:
                                betting_system.on_loss()
                            profit_value = None
                            try:
                                if b_before is not None and b_after is not None:
                                    profit_value = float(b_after) - float(b_before)
                                else:
                                    if correct:
                                        profit_value = payout - bet_amount
                                    else:
                                        profit_value = -bet_amount
                            except Exception:
                                profit_value = (payout - bet_amount) if correct else -bet_amount
                            record['bet'] = {'type': bet_type, 'amount': float(bet_amount), 'profit': _safe_round(profit_value, DECIMALS), 'balance_before': b_before, 'balance_after': b_after}
                            state['bet_stats'] = betting_system.get_stats()
                        ms = state.get('model_stats') or {}
                        ms['predictions'] = ms.get('predictions', 0) + 1
                        if correct:
                            ms['wins'] = ms.get('wins', 0) + 1
                            ms['current_streak'] = 0
                        else:
                            ms['losses'] = ms.get('losses', 0) + 1
                            ms['current_streak'] = ms.get('current_streak', 0) + 1
                        state['model_stats'] = ms
                    try:
                        record['timestamp'] = datetime.utcnow().isoformat() + 'Z'
                    except Exception:
                        record['timestamp'] = None
                    history.append(record)
                    state['history'] = history
                    state['three_number_analysis'] = three_number_analyzer.analyze(history)
                    try:
                        live.update(make_tbtool_layout(state))
                    except Exception:
                        pass
            next_id = (last_id or 0) + 1
            if next_id not in pending:
                analysis = three_number_analyzer.analyze(history)
                state['three_number_analysis'] = analysis
                predicted_outcome = analysis.get('bet_action', 'small')
                prediction_label = analysis.get('prediction', '1-3')
                conf = analysis.get('confidence', 0.5)
                if state.get('is_vip', False) or state.get('is_admin', False):
                    if predicted_outcome == 'small':
                        predicted_outcome = 'big'
                    elif predicted_outcome == 'big':
                        predicted_outcome = 'small'
                    state['log_text'] = f"👑 VIP/Admin Đảo ngược: {analysis.get('bet_action', 'small')} → {predicted_outcome}"
                decision = {'action': 'PREDICT', 'bet_action': predicted_outcome, 'prediction': prediction_label, 'confidence': conf}
                pending[next_id] = decision
                icon = ICON_LOTTO.get(predicted_outcome, '')
                state['next_prediction'] = f"{icon} {predicted_outcome.upper()}"
                state['next_confidence'] = conf
                if not state.get('is_vip', False) and not state.get('is_admin', False):
                    state['log_text'] = f'Dự #{next_id}: {predicted_outcome.upper()} (tin cậy {conf*100:.1f}%)'
                if betting_system:
                    bet_amount = betting_system.get_bet_amount()
                    samples = analysis.get('sample_sizes', [0,0,0])
                    avg_sample = sum(samples) / 3.0 if samples else 0.0
                    state['planned_bet'] = bet_amount
                    success, message = place_bet(session, headers, next_id, predicted_outcome, bet_amount, asset)
                    if success:
                        betting_system.record_wager(bet_amount)
                        try:
                            b_before = None
                            bmap = state.get('balances') or {}
                            bval = bmap.get('BUILD')
                            if isinstance(bval, dict):
                                b_before = float(bval.get('balance', 0.0))
                            else:
                                b_before = _safe_round(bval)
                        except Exception:
                            b_before = None
                        pending_bets[next_id] = {'type': predicted_outcome, 'amount': bet_amount, 'balance_before': b_before}
                        state['bet_stats'] = betting_system.get_stats()
                        state['log_text'] = f'💰 #{next_id}: {bet_amount:.2f} {asset} → {predicted_outcome.upper()}'
                    else:
                        state['log_text'] = f'⚠ Lỗi: {message[:30]}'
                else:
                    state['log_text'] = f'🎯 Dự #{next_id}: {predicted_outcome.upper()}'
                    state['planned_bet'] = 0.0
                try:
                    live.update(make_tbtool_layout(state))
                except Exception:
                    pass
            try:
                live.update(make_tbtool_layout(state))
            except Exception:
                pass
            time.sleep(HOME_POLL_INTERVAL)
    console.clear()
    if betting_system:
        stats = betting_system.get_stats()
        summary_text = Text()
        summary_text.append(f"{ICONS['chart']} Tổng cược: {stats['total_bets']}\n", style=f"bold {TBTOOL_COLORS['platinum']}")
        summary_text.append(f"✅ Thắng: {stats['wins']}\n", style=f"bold {TBTOOL_COLORS['emerald']}")
        summary_text.append(f"❌ Thua: {stats['losses']}\n\n", style=f"bold {TBTOOL_COLORS['ruby']}")
        summary_text.append(f"{ICONS['money']} Đã cược: {stats['total_wagered']:.2f} {asset}\n", style=TBTOOL_COLORS["gold"])
        profit = stats['net_profit']
        profit_style = f"bold {TBTOOL_COLORS['emerald']}" if profit > 0 else (f"bold {TBTOOL_COLORS['ruby']}" if profit < 0 else TBTOOL_COLORS["gold"])
        summary_text.append(f"{ICONS['chart']} Lãi/Lỗ: {profit:+.2f} {asset}\n\n", style=profit_style)
        summary_text.append(f"{ICONS['fire']} Chuỗi thắng tối đa: {stats['max_win_streak']} 🏆\n", style=TBTOOL_COLORS["emerald"])
        summary_text.append(f"💔 Chuỗi thua tối đa: {stats['max_loss_streak']}", style=TBTOOL_COLORS["ruby"])
        console.print(Panel(Align.center(summary_text), title=f"{ICONS['crown']} KẾT THÚC - TBTOOL VIP {ICONS['crown']}", border_style=TBTOOL_COLORS["gold"], box=box.DOUBLE))
    else:
        console.print(f"[bold {TBTOOL_COLORS['gold']}]🎲 Đã dừng - TBTOOL VIP[/bold {TBTOOL_COLORS['gold']}]")

# ================== PHẦN 5: MAIN ==================

def main():
    console.clear()
    console.print(show_ultimate_header())
    console.print()
    is_valid, key, is_vip = show_key_menu()
    if not is_valid:
        console.print("[red]❌ Không thể kích hoạt. Thoát.[/red]")
        time.sleep(2)
        return
    choice = show_tool_selection()
    try:
        if choice == '1':
            console.print(f"{ICONS['rocket']} Đang khởi động VUA THOÁT HIỂM...", style=f"bold {TBTOOL_COLORS['neon_blue']}")
            if is_vip:
                console.print(f"[bold gold]👑 VIP MODE: Logic Độc Quyền TBTOOL VIP[/bold gold]")
            time.sleep(1)
            main_vth()
        elif choice == '2':
            console.print(f"{ICONS['rocket']} Đang khởi động LOTTO...", style=f"bold {TBTOOL_COLORS['neon_pink']}")
            if is_vip:
                console.print(f"[bold gold]👑 VIP MODE: Logic Đảo Ngược TBTOOL VIP[/bold gold]")
            time.sleep(1)
            main_lotto()
    except KeyboardInterrupt:
        console.print(f"\n[bold {TBTOOL_COLORS['gold']}]Đã dừng. {ICONS['crown']}[/bold {TBTOOL_COLORS['gold']}]")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        console.print(f"\n[bold {TBTOOL_COLORS['gold']}]Đã dừng. {ICONS['crown']}[/bold {TBTOOL_COLORS['gold']}]")
        sys.exit(0)